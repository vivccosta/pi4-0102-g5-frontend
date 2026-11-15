import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import { AuthContext } from '@/features/auth/context'
import { clearSession, saveSession } from '@/lib/session'
import { server } from '@/mocks/server'
import { useRevogarCertificado } from './useRevogarCertificado'

const queryKey = ['certificados', 'emissor-uuid-1']

function montarHook() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: 3 } },
  })
  const session = {
    token: 'token-teste',
    nome: 'Emissor Demonstração',
    perfil: 'EMISSOR' as const,
    emissorId: 'emissor-uuid-1',
    exp: Math.floor(Date.now() / 1000) + 3600,
  }
  saveSession(session)

  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(AuthContext.Provider, {
        value: { session, isAuthenticated: true, login: () => undefined, logout: () => undefined },
        children,
      }),
    )
  }

  return { ...renderHook(() => useRevogarCertificado(), { wrapper: Wrapper }), queryClient }
}

beforeEach(() => {
  clearSession()
  window.__TIMBRO_CONFIG__ = { apiUrl: 'http://localhost:8080' }
})

describe('useRevogarCertificado', () => {
  it('mantém o cache até a resposta de sucesso e então invalida', async () => {
    let informarInicio: (() => void) | undefined
    let liberarResposta: (() => void) | undefined
    const iniciou = new Promise<void>((resolve) => { informarInicio = resolve })
    const respostaLiberada = new Promise<void>((resolve) => { liberarResposta = resolve })
    server.use(http.post('*/api/certificados/:certificadoId/revogar', async () => {
      informarInicio?.()
      await respostaLiberada
      return HttpResponse.json({ sucesso: true, mensagem: 'Certificado revogado com sucesso.' })
    }))

    const { result, queryClient } = montarHook()
    queryClient.setQueryData(queryKey, [{ certificadoId: '1', status: 'valido' }])
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries')
    let mutacao!: Promise<unknown>
    act(() => { mutacao = result.current.mutateAsync(1) })
    await iniciou
    expect(invalidar).not.toHaveBeenCalled()
    await waitFor(() => expect(result.current.isPending).toBe(true))

    liberarResposta?.()
    await act(async () => { await mutacao })
    expect(invalidar).toHaveBeenCalledWith({ queryKey })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('não repete a operação em erro e expõe ApiError tipado', async () => {
    let chamadas = 0
    server.use(http.post('*/api/certificados/:certificadoId/revogar', () => {
      chamadas += 1
      return HttpResponse.json({ status: 500, mensagem: 'Falha interna.' }, { status: 500 })
    }))
    const { result } = montarHook()

    await act(async () => {
      await expect(result.current.mutateAsync(1)).rejects.toBeInstanceOf(ApiError)
    })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(chamadas).toBe(1)
    expect(result.current.error).toMatchObject({ kind: 'http', status: 500 })
  })

  it('invalida a lista após receber 400 de certificado já revogado', async () => {
    const { result, queryClient } = montarHook()
    const invalidar = vi.spyOn(queryClient, 'invalidateQueries')

    await act(async () => {
      await expect(result.current.mutateAsync(400)).rejects.toMatchObject({
        kind: 'http', status: 400, mensagem: 'Este certificado já se encontra revogado.',
      })
    })
    expect(invalidar).toHaveBeenCalledWith({ queryKey })
  })
})
