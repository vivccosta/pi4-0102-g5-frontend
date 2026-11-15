import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { registrarCertificado } from './certificados'
import { server } from '@/mocks/server'
import { saveSession } from '@/lib/session'

const payload = {
  nomeAluno: 'Ana Exemplo',
  cpfAluno: '52998224725',
  curso: 'Sistemas de Informação',
  cargaHoraria: 120,
  dataConclusao: '2026-10-14',
}

beforeEach(() => {
  window.__TIMBRO_CONFIG__ = { apiUrl: 'http://localhost:8080' }
  saveSession({ token: 'token-teste', nome: 'Emissor', perfil: 'EMISSOR', emissorId: 'emissor-1', exp: Math.floor(Date.now() / 1000) + 3600 })
})

describe('registrarCertificado', () => {
  it('envia o payload contratual e o Bearer, sem token no corpo', async () => {
    let bodyRecebido: unknown
    let authorization: string | null = null
    server.use(http.post('*/api/certificados/registrar', async ({ request }) => {
      authorization = request.headers.get('Authorization')
      bodyRecebido = await request.json()
      return HttpResponse.json({ sucesso: true, mensagem: 'Registro concluído.', hash: `0x${'a'.repeat(64)}` })
    }))

    await registrarCertificado(payload)
    expect(authorization).toBe('Bearer token-teste')
    expect(bodyRecebido).toEqual(payload)
    expect(bodyRecebido).not.toHaveProperty('tokenEmissor')
    expect(typeof (bodyRecebido as typeof payload).cargaHoraria).toBe('number')
    expect((bodyRecebido as typeof payload).dataConclusao).toBe('2026-10-14')
  })

  it('valida a resposta de sucesso com zod', async () => {
    const resultado = await registrarCertificado(payload)
    expect(resultado.hash).toMatch(/^0x[a-f0-9]{64}$/)
  })

  it('converte resposta incompatível em erro de contrato', async () => {
    server.use(http.post('*/api/certificados/registrar', () => HttpResponse.json({ sucesso: 'sim' })))
    await expect(registrarCertificado(payload)).rejects.toMatchObject({ kind: 'contrato' })
  })

  it.each([
    ['400', { ...payload, curso: 'mock-erro-400' }, 400, 'Verifique os dados do certificado.'],
    ['401', payload, 401, 'Sua sessão expirou. Entre novamente.'],
    ['403', payload, 403, 'Você não tem permissão para registrar este certificado.'],
    ['500', { ...payload, curso: 'mock-erro-500' }, 500, 'Não foi possível concluir a operação agora. Tente novamente em instantes.'],
  ])('mapeia erro HTTP %s para ApiError', async (_caso, dados, status, mensagem) => {
    if (status === 401) {
      saveSession({ token: 'token-401', nome: 'Emissor', perfil: 'EMISSOR', exp: Math.floor(Date.now() / 1000) + 3600 })
    } else if (status === 403) {
      saveSession({ token: 'token-403', nome: 'Emissor', perfil: 'EMISSOR', exp: Math.floor(Date.now() / 1000) + 3600 })
    }
    await expect(registrarCertificado(dados)).rejects.toMatchObject({ kind: 'http', status, mensagem })
  })
})
