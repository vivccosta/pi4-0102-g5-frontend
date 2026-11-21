import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { onUnauthorized, request } from './http'

describe('request (http client)', () => {
  beforeEach(() => {
    window.__TIMBRO_CONFIG__ = {
      apiUrl: 'http://localhost:8080',
    }
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('faz requisição GET com sucesso e retorna JSON', async () => {
    const mockData = { id: 1, nome: 'Teste' }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const result = await request('/api/teste', { auth: 'none' })
    expect(result).toEqual(mockData)
  })

  it('inclui token Bearer quando auth: required e há sessão ativa', async () => {
    sessionStorage.setItem(
      'timbro.sessao',
      JSON.stringify({
        token: 'token-valido',
        nome: 'Emissor Teste',
        perfil: 'EMISSOR',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    )

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await request('/api/protegida', { auth: 'required' })
    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:8080/api/protegida',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer token-valido',
        }),
      }),
    )
  })

  it('não inclui token Bearer quando token na sessão está expirado (exp em segundos no passado)', async () => {
    sessionStorage.setItem(
      'timbro.sessao',
      JSON.stringify({
        token: 'token-expirado',
        nome: 'Emissor Expirado',
        perfil: 'EMISSOR',
        exp: Math.floor(Date.now() / 1000) - 60, // expirado há 1 minuto
      }),
    )

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await request('/api/protegida', { auth: 'required' })
    const calledHeaders = fetchSpy.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(calledHeaders['Authorization']).toBeUndefined()
    expect(sessionStorage.getItem('timbro.sessao')).toBeNull()
  })

  it('não envia Authorization quando auth: none', async () => {
    sessionStorage.setItem(
      'timbro.sessao',
      JSON.stringify({
        token: 'token-valido',
        nome: 'Emissor Teste',
        perfil: 'EMISSOR',
        exp: Math.floor(Date.now() / 1000) + 3600,
      }),
    )

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await request('/api/publica', { auth: 'none' })
    const calledHeaders = fetchSpy.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(calledHeaders['Authorization']).toBeUndefined()
  })

  it('não define Content-Type manual para FormData (deixa o navegador definir boundary)', async () => {
    const formData = new FormData()
    formData.append('chave', '123')

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ valido: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await request('/api/validar', {
      method: 'POST',
      body: formData,
      auth: 'none',
    })

    const calledHeaders = fetchSpy.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(calledHeaders['Content-Type']).toBeUndefined()
  })

  it('tolera respostas 200 em texto puro', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Status alterado com sucesso', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      }),
    )

    const result = await request('/api/status', { auth: 'none' })
    expect(result).toBe('Status alterado com sucesso')
  })

  it('valida resposta com schema Zod e lança erro de contrato se inválido', async () => {
    const schema = z.object({
      id: z.string(),
      valor: z.number(),
    })

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 123 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(request('/api/dados', { auth: 'none', schema })).rejects.toThrow()
  })

  it('dispara callback de não autorizado no status 401 para rotas protegidas', async () => {
    const unauthorizedCb = vi.fn()
    const unsubscribe = onUnauthorized(unauthorizedCb)

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ mensagem: 'Token inválido' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(request('/api/protegido', { auth: 'required' })).rejects.toThrow()
    expect(unauthorizedCb).toHaveBeenCalledTimes(1)

    unsubscribe()
  })

  it('dispara callback de não autorizado no status 403 sem mensagem (sessão inválida Spring)', async () => {
    const unauthorizedCb = vi.fn()
    const unsubscribe = onUnauthorized(unauthorizedCb)

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('', {
        status: 403,
      }),
    )

    await expect(request('/api/protegido', { auth: 'required' })).rejects.toThrow()
    expect(unauthorizedCb).toHaveBeenCalledTimes(1)

    unsubscribe()
  })

  it('NÃO dispara callback de não autorizado em 401 se auth: none (ex: tela de login)', async () => {
    const unauthorizedCb = vi.fn()
    const unsubscribe = onUnauthorized(unauthorizedCb)

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ mensagem: 'Credenciais inválidas' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    await expect(request('/api/auth/login', { auth: 'none' })).rejects.toThrow()
    expect(unauthorizedCb).not.toHaveBeenCalled()

    unsubscribe()
  })

  it('NÃO dispara callback de não autorizado em 403 COM mensagem no corpo (erro de negócio)', async () => {
    const unauthorizedCb = vi.fn()
    const unsubscribe = onUnauthorized(unauthorizedCb)

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({ mensagem: 'Você não tem permissão para revogar este certificado.' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    await expect(request('/api/certificados/123/revogar', { auth: 'required' })).rejects.toThrow()
    expect(unauthorizedCb).not.toHaveBeenCalled()

    unsubscribe()
  })
})

describe('request: corpo de texto puro com Content-Type application/json', () => {
  it('aceita a mensagem de texto do backend (CT8) mesmo rotulada como application/json', async () => {
    window.__TIMBRO_CONFIG__ = { apiUrl: 'http://localhost:8080' }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response('Cadastro realizado com sucesso. Aguardando aprovação do administrador.', {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )

    const resultado = await request('/api/emissores/cadastrar', {
      method: 'POST',
      auth: 'none',
      body: { nome: 'X' },
      acceptedStatuses: [201],
      schema: z.string(),
    })

    expect(resultado).toBe('Cadastro realizado com sucesso. Aguardando aprovação do administrador.')
  })
})
