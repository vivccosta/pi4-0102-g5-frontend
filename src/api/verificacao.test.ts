import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { validarCertificado } from './verificacao'

describe('validarCertificado', () => {
  beforeEach(() => {
    window.__TIMBRO_CONFIG__ = { apiUrl: 'http://localhost:8080' }
    sessionStorage.setItem('timbro.sessao', JSON.stringify({ token: 'token-de-teste', nome: 'Teste', perfil: 'EMISSOR', emissorId: 'id-1', exp: Math.floor(Date.now() / 1000) + 3600 }))
  })

  it('envia multipart com a chave e não envia Authorization mesmo com sessão', async () => {
    let recebido: FormData | undefined
    let authorization: string | null = null
    server.use(http.post('*/api/certificados/validar', async ({ request }) => {
      authorization = request.headers.get('authorization')
      recebido = await request.formData()
      return HttpResponse.json({ valido: false, mensagem: 'Certificado inválido: teste.' })
    }))
    await validarCertificado('AbC-123')
    expect(recebido?.get('tipoValidacao')).toBe('CHAVE')
    expect(recebido?.get('chaveAutenticacao')).toBe('AbC-123')
    expect(authorization).toBeNull()
  })

  it('aceita 404 com corpo de certificado inválido', async () => {
    server.use(http.post('*/api/certificados/validar', () => HttpResponse.json({ valido: false, mensagem: 'Certificado inválido: não encontrado.' }, { status: 404 })))
    await expect(validarCertificado('nao-existe')).resolves.toMatchObject({ valido: false })
  })

  it('normaliza CT14 com status e campos Lombok nulos como inválido', async () => {
    server.use(http.post('*/api/certificados/validar', () => HttpResponse.json({ status: 'INVALIDO', mensagem: 'Certificado inválido.', nomeAluno: null, curso: null, dataConclusao: null, hash: null })))
    await expect(validarCertificado('desconhecida')).resolves.toMatchObject({ valido: false, nomeAluno: null, hash: null })
  })

  it('aborta requisição cancelada e expõe erro de timeout da camada HTTP', async () => {
    server.use(http.post('*/api/certificados/validar', async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      return HttpResponse.json({ valido: false, mensagem: 'Inválido.' })
    }))
    const controller = new AbortController()
    setTimeout(() => controller.abort(), 10)
    await expect(validarCertificado('chave', controller.signal)).rejects.toMatchObject({ kind: 'timeout' })
  })
})
