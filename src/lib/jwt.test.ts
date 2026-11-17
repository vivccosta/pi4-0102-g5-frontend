import { describe, expect, it } from 'vitest'
import { decodeJwtPayload } from './jwt'

describe('decodeJwtPayload', () => {
  function createToken(payload: Record<string, unknown>): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const body = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    return `${header}.${body}.assinatura_ficticia`
  }

  it('decodifica payload válido com sucesso', () => {
    const token = createToken({
      sub: 'emissor@teste.com',
      perfil: 'EMISSOR',
      id: 123,
      iat: 1700000000,
      exp: 1700003600,
    })

    const decoded = decodeJwtPayload(token)
    expect(decoded).toEqual({
      sub: 'emissor@teste.com',
      perfil: 'EMISSOR',
      id: '123',
      iat: 1700000000,
      exp: 1700003600,
    })
  })

  it('aceita emissorId no campo emissorId se id não existir', () => {
    const token = createToken({
      sub: 'admin@teste.com',
      perfil: 'ADMINISTRADOR',
      emissorId: 'admin-456',
      exp: 1700003600,
    })

    const decoded = decodeJwtPayload(token)
    expect(decoded?.id).toBe('admin-456')
    expect(decoded?.perfil).toBe('ADMINISTRADOR')
  })

  it('normaliza claim id numérico para string', () => {
    expect(decodeJwtPayload(createToken({ sub: 'e@teste.com', perfil: 'EMISSOR', id: 42, exp: 1700003600 }))?.id).toBe('42')
  })

  it('retorna null para token vazio ou com formato inválido', () => {
    expect(decodeJwtPayload('')).toBeNull()
    expect(decodeJwtPayload('invalido')).toBeNull()
    expect(decodeJwtPayload('header.payload')).toBeNull()
  })

  it('retorna null para payload malformado (não JSON ou base64 corrompido)', () => {
    expect(decodeJwtPayload('header.!!!invalido!!!.sig')).toBeNull()
  })

  it('retorna null se claims obrigatórias (sub, perfil, exp) estiverem ausentes', () => {
    const semSub = createToken({ perfil: 'EMISSOR', exp: 1700003600 })
    expect(decodeJwtPayload(semSub)).toBeNull()

    const semExp = createToken({ sub: 'a@b.com', perfil: 'EMISSOR' })
    expect(decodeJwtPayload(semExp)).toBeNull()

    const perfilInvalido = createToken({
      sub: 'a@b.com',
      perfil: 'OUTRO_PERFIL',
      exp: 1700003600,
    })
    expect(decodeJwtPayload(perfilInvalido)).toBeNull()
  })
})
