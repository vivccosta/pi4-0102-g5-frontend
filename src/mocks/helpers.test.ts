import { http } from 'msw'
import { describe, expect, it } from 'vitest'
import { erroEnvelope } from './helpers'
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
})
