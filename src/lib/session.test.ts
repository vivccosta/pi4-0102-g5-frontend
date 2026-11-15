import { beforeEach, describe, expect, it } from 'vitest'
import { clearSession, getSession, hasSession, saveSession } from './session'

describe('session', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  it('salva e recupera sessão válida', () => {
    const dados = {
      token: 'jwt-token-123',
      nome: 'Emissor Alfa',
      perfil: 'EMISSOR' as const,
      emissorId: 'emissor-1',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }

    saveSession(dados)
    expect(hasSession()).toBe(true)

    const session = getSession()
    expect(session).toEqual(dados)
  })

  it('normaliza perfil para maiúsculas', () => {
    saveSession({
      token: 'jwt-token-123',
      nome: 'Admin',
      // @ts-expect-error teste com valor em minúsculo
      perfil: 'administrador',
      exp: Math.floor(Date.now() / 1000) + 3600,
    })

    const session = getSession()
    expect(session?.perfil).toBe('ADMINISTRADOR')
  })

  it('retorna null e limpa sessão quando expirada', () => {
    const dados = {
      token: 'jwt-token-123',
      nome: 'Emissor Alfa',
      perfil: 'EMISSOR' as const,
      exp: Math.floor(Date.now() / 1000) - 10, // expirada há 10s
    }

    sessionStorage.setItem('timbro.sessao', JSON.stringify(dados))

    expect(getSession()).toBeNull()
    expect(hasSession()).toBe(false)
    expect(sessionStorage.getItem('timbro.sessao')).toBeNull()
  })

  it('retorna null e limpa dados se JSON for inválido', () => {
    sessionStorage.setItem('timbro.sessao', 'invalido-json{')

    expect(getSession()).toBeNull()
    expect(hasSession()).toBe(false)
  })

  it('limpa sessão com clearSession()', () => {
    saveSession({
      token: 'jwt-token-123',
      nome: 'Emissor',
      perfil: 'EMISSOR',
      exp: Math.floor(Date.now() / 1000) + 3600,
    })

    clearSession()
    expect(hasSession()).toBe(false)
    expect(getSession()).toBeNull()
  })
})
