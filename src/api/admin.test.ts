import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { resetMockEmissores } from '@/mocks/handlers'
import { clearSession, saveSession } from '@/lib/session'
import { ativarEmissor, listarEmissoresPendentes } from './admin'

beforeEach(() => {
  clearSession()
  resetMockEmissores()
  window.__TIMBRO_CONFIG__ = { apiUrl: 'http://localhost:8080' }
  saveSession({ token: 'admin-token', nome: 'Admin', perfil: 'ADMINISTRADOR', emissorId: 'admin-1', exp: Math.floor(Date.now() / 1000) + 3600 })
})

describe('API de emissores pendentes', () => {
  it('lista três emissores, aceita lista vazia e tolera texto puro ao ativar', async () => {
    expect(await listarEmissoresPendentes()).toHaveLength(3)
    saveSession({ token: 'token-vazio', nome: 'Admin', perfil: 'ADMINISTRADOR', emissorId: 'admin-1', exp: Math.floor(Date.now() / 1000) + 3600 })
    expect(await listarEmissoresPendentes()).toEqual([])
    saveSession({ token: 'admin-token', nome: 'Admin', perfil: 'ADMINISTRADOR', emissorId: 'admin-1', exp: Math.floor(Date.now() / 1000) + 3600 })
    await expect(ativarEmissor('emissor-pendente-1')).resolves.toBe('Emissor ativado.')
    expect(await listarEmissoresPendentes()).toHaveLength(2)
  })

  it('envia PUT, Bearer e novoStatus; propaga 404 e 403 e trata 500 como erro genérico', async () => {
    let requisicaoCorreta = false
    server.use(http.put('*/api/admin/emissores/probe/status', async ({ request }) => {
      requisicaoCorreta = request.headers.get('Authorization') === 'Bearer admin-token' &&
        request.method === 'PUT' && (await request.json() as { novoStatus?: string }).novoStatus === 'ATIVO'
      return new HttpResponse('ok', { status: 200 })
    }))
    await ativarEmissor('probe')
    expect(requisicaoCorreta).toBe(true)

    await expect(ativarEmissor('404')).rejects.toMatchObject({ status: 404, mensagem: 'Emissor não encontrado.' })
    saveSession({ token: 'token-403', nome: 'Admin', perfil: 'ADMINISTRADOR', emissorId: 'admin-1', exp: Math.floor(Date.now() / 1000) + 3600 })
    await expect(listarEmissoresPendentes()).rejects.toMatchObject({ status: 403 })
    saveSession({ token: 'token-500', nome: 'Admin', perfil: 'ADMINISTRADOR', emissorId: 'admin-1', exp: Math.floor(Date.now() / 1000) + 3600 })
    await expect(listarEmissoresPendentes()).rejects.toMatchObject({ status: 500, mensagem: 'Não foi possível concluir a operação agora. Tente novamente em instantes.' })
  })
})
