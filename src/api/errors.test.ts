import { describe, expect, it } from 'vitest'
import { ApiError, ContratoInvalidoError, MENSAGEM_ERRO_GENERICA } from './errors'

describe('ApiError', () => {
  it('cria erro HTTP 400 com mensagem do backend', () => {
    const error = ApiError.fromHttp(400, 'Campos obrigatórios não preenchidos')
    expect(error.kind).toBe('http')
    expect(error.status).toBe(400)
    expect(error.mensagem).toBe('Campos obrigatórios não preenchidos')
  })

  it('cria erro HTTP 401 com mensagem do backend', () => {
    const error = ApiError.fromHttp(401, 'Acesso não autorizado.')
    expect(error.kind).toBe('http')
    expect(error.status).toBe(401)
    expect(error.mensagem).toBe('Acesso não autorizado.')
  })

  it('cria erro HTTP 500 com mensagem genérica fixa (sem vazar mensagem técnica)', () => {
    const error = ApiError.fromHttp(500, 'NullPointerException at Database.java:42')
    expect(error.kind).toBe('http')
    expect(error.status).toBe(500)
    expect(error.mensagem).toBe(MENSAGEM_ERRO_GENERICA)
  })

  it('cria erro de rede com mensagem genérica amigável', () => {
    const error = ApiError.rede('Failed to fetch')
    expect(error.kind).toBe('rede')
    expect(error.mensagem).toBe(MENSAGEM_ERRO_GENERICA)
  })

  it('cria erro de timeout com mensagem genérica amigável', () => {
    const error = ApiError.timeout()
    expect(error.kind).toBe('timeout')
    expect(error.mensagem).toBe(MENSAGEM_ERRO_GENERICA)
  })

  it('cria erro de contrato inválido com mensagem genérica', () => {
    const error = ApiError.contrato('campo hash ausente')
    expect(error).toBeInstanceOf(ContratoInvalidoError)
    expect(error.kind).toBe('contrato')
    expect(error.mensagem).toBe(MENSAGEM_ERRO_GENERICA)
  })
})
