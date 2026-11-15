import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { decodeJwtPayload } from '../lib/jwt'
import { base64UrlEncode, erroEnvelope, gerarMockJwt } from './helpers'
import { server } from './server'

describe('MSW infraestrutura e helpers', () => {
  it('erroEnvelope formata resposta com status e objeto { status, mensagem }', async () => {
    const response = erroEnvelope(400, 'Dados inválidos')

    expect(response.status).toBe(400)
    const body = (await response.json()) as { status: number; mensagem: string }
    expect(body).toEqual({
      status: 400,
      mensagem: 'Dados inválidos',
    })
  })

  it('servidor MSW intercepta requisição simulada em teste', async () => {
    server.use(
      http.get('http://localhost:8080/api/teste-mock', () => {
        return erroEnvelope(404, 'Não encontrado')
      }),
    )

    const res = await fetch('http://localhost:8080/api/teste-mock')
    expect(res.status).toBe(404)
    const data = await res.json()
    expect(data).toEqual({ status: 404, mensagem: 'Não encontrado' })
  })

  it('gerarMockJwt cria JWT válido com expiração em segundos e suporte a UTF-8', () => {
    const agora = Math.floor(Date.now() / 1000)
    const token = gerarMockJwt({
      sub: 'usuario@timbro.test',
      id: 'usr-123',
      perfil: 'EMISSOR',
      nome: 'José Validação e Acentuação',
      exp: agora + 3600,
    })

    const decoded = decodeJwtPayload(token)
    expect(decoded).not.toBeNull()
    expect(decoded?.sub).toBe('usuario@timbro.test')
    expect(decoded?.id).toBe('usr-123')
    expect(decoded?.perfil).toBe('EMISSOR')
    expect(decoded?.exp).toBe(agora + 3600)
    expect(token.split('.')).toHaveLength(3)
  })

  it('base64UrlEncode codifica caracteres sem gerar padding inválido para URL', () => {
    const encoded = base64UrlEncode('{"teste":"olá mundo"}')
    expect(encoded).not.toContain('+')
    expect(encoded).not.toContain('/')
    expect(encoded).not.toContain('=')
  })
})
