import { act, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { queryClient } from '@/app/queryClient'
import { gerarMockJwt } from '@/mocks/helpers'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'

describe('AuthContext e useAuth', () => {
  beforeEach(() => {
    sessionStorage.clear()
    queryClient.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    sessionStorage.clear()
    queryClient.clear()
    vi.useRealTimers()
  })

  it('lança erro descritivo quando useAuth é chamado fora de AuthProvider', () => {
    // Silencia console.error do React para erro esperado
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth deve ser usado dentro de um AuthProvider',
    )
    spy.mockRestore()
  })

  it('inicia com sessão nula e isAuthenticated false quando sessionStorage está vazio', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <MemoryRouter><AuthProvider>{children}</AuthProvider></MemoryRouter>,
    })

    expect(result.current.session).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('inicia com a sessão recuperada se houver token válido no sessionStorage', () => {
    const agora = Math.floor(Date.now() / 1000)
    sessionStorage.setItem(
      'timbro.sessao',
      JSON.stringify({
        token: 'token-existente',
        nome: 'Maria Silva',
        perfil: 'EMISSOR',
        emissorId: 'id-123',
        exp: agora + 1800,
      }),
    )

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <MemoryRouter><AuthProvider>{children}</AuthProvider></MemoryRouter>,
    })

    expect(result.current.session).not.toBeNull()
    expect(result.current.session?.nome).toBe('Maria Silva')
    expect(result.current.session?.perfil).toBe('EMISSOR')
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('login decodifica o JWT, normaliza perfil e atualiza estado e sessionStorage', () => {
    const agora = Math.floor(Date.now() / 1000)
    const token = gerarMockJwt({
      sub: 'usuario@timbro.test',
      id: 999,
      perfil: 'EMISSOR',
      nome: 'Carlos Emissor',
      exp: agora + 3600,
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <MemoryRouter><AuthProvider>{children}</AuthProvider></MemoryRouter>,
    })

    act(() => {
      result.current.login({
        token,
        nome: 'Carlos Emissor',
        perfil: 'emissor' as 'EMISSOR',
      })
    })

    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.session?.perfil).toBe('EMISSOR')
    expect(result.current.session?.emissorId).toBe('999')
    expect(result.current.session?.nome).toBe('Carlos Emissor')
    expect(result.current.session?.exp).toBe(agora + 3600)

    const stored = JSON.parse(sessionStorage.getItem('timbro.sessao') || '{}')
    expect(stored.perfil).toBe('EMISSOR')
    expect(stored.emissorId).toBe('999')
  })

  it('logout limpa o sessionStorage, limpa o queryClient e reseta o estado', () => {
    const queryClientClearSpy = vi.spyOn(queryClient, 'clear')
    const agora = Math.floor(Date.now() / 1000)
    const token = gerarMockJwt({
      sub: 'admin@timbro.test',
      perfil: 'ADMINISTRADOR',
      nome: 'Admin',
      exp: agora + 3600,
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <MemoryRouter><AuthProvider>{children}</AuthProvider></MemoryRouter>,
    })

    act(() => {
      result.current.login({
        token,
        nome: 'Admin',
        perfil: 'ADMINISTRADOR',
      })
    })

    expect(result.current.isAuthenticated).toBe(true)

    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.session).toBeNull()
    expect(sessionStorage.getItem('timbro.sessao')).toBeNull()
    expect(queryClientClearSpy).toHaveBeenCalled()
  })

  it('encerra a sessão automaticamente via timer quando o tempo de expiração é atingido', () => {
    vi.useFakeTimers()
    const agora = Math.floor(Date.now() / 1000)
    // Expira em 10 segundos
    const token = gerarMockJwt({
      sub: 'emissor@timbro.test',
      perfil: 'EMISSOR',
      nome: 'Emissor Temporizado',
      exp: agora + 10,
    })

    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <MemoryRouter><AuthProvider>{children}</AuthProvider></MemoryRouter>,
    })

    act(() => {
      result.current.login({
        token,
        nome: 'Emissor Temporizado',
        perfil: 'EMISSOR',
      })
    })

    expect(result.current.isAuthenticated).toBe(true)

    // Avança 9 segundos: ainda ativo
    act(() => {
      vi.advanceTimersByTime(9000)
    })
    expect(result.current.isAuthenticated).toBe(true)

    // Avança mais 2 segundos (total 11s, além do exp de 10s): expirou
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.session).toBeNull()
    expect(sessionStorage.getItem('timbro.sessao')).toBeNull()
  })

  it('renderiza os filhos corretamente no AuthProvider', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <div>Filho de Teste</div>
        </AuthProvider>
      </MemoryRouter>,
    )

    expect(screen.getByText('Filho de Teste')).toBeInTheDocument()
  })
})
