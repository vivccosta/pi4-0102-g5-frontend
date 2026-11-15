import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { listarCertificados, registrarCertificado } from './certificados'
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

describe('listarCertificados', () => {
  it('usa o emissorId na URL e normaliza status e chave na borda da API', async () => {
    let urlRecebida = ''
    let authorization: string | null = null
    server.use(http.get('*/api/emissores/:emissorId/certificados', ({ request }) => {
      urlRecebida = request.url
      authorization = request.headers.get('Authorization')
      return HttpResponse.json([{
        certificadoId: 'certificado 1',
        nomeAluno: 'Ana Exemplo',
        hash: '  chave\n de teste  ',
        dataEmissao: '2026-10-14T09:30:00',
        status: 'valido',
      }])
    }))

    const resultado = await listarCertificados('emissor da PUC')
    expect(urlRecebida).toBe('http://localhost:8080/api/emissores/emissor%20da%20PUC/certificados')
    expect(authorization).toBe('Bearer token-teste')
    expect(resultado).toEqual([{
      certificadoId: 'certificado 1',
      nomeAluno: 'Ana Exemplo',
      hash: 'chavedeteste',
      dataEmissao: '2026-10-14T09:30:00',
      status: 'valido',
    }])
  })

  it('valida lista vazia e certificado com curso ausente', async () => {
    expect(await listarCertificados('emissor-vazio')).toEqual([])
    const certificados = await listarCertificados('emissor-uuid-1')
    expect(certificados[1]?.curso).toBeUndefined()
    expect(certificados[1]?.status).toBe('invalido')
  })

  it('envia Bearer e usa os erros de negócio e indisponibilidade do contrato', async () => {
    saveSession({ token: 'token-403', nome: 'Emissor', perfil: 'EMISSOR', emissorId: 'emissor-1', exp: Math.floor(Date.now() / 1000) + 3600 })
    await expect(listarCertificados('emissor-1')).rejects.toMatchObject({
      kind: 'http', status: 403,
      mensagem: 'Acesso negado. Você só pode visualizar o seu próprio histórico.',
    })
    saveSession({ token: 'token-500', nome: 'Emissor', perfil: 'EMISSOR', emissorId: 'emissor-1', exp: Math.floor(Date.now() / 1000) + 3600 })
    await expect(listarCertificados('emissor-1')).rejects.toMatchObject({
      kind: 'http', status: 500,
      mensagem: 'Não foi possível concluir a operação agora. Tente novamente em instantes.',
    })
  })

  it('não envia Authorization quando não há sessão', async () => {
    let authorization: string | null = 'nao-consultado'
    server.use(http.get('*/api/emissores/:emissorId/certificados', ({ request }) => {
      authorization = request.headers.get('Authorization')
      return new HttpResponse(null, { status: 403 })
    }))
    sessionStorage.clear()
    await expect(listarCertificados('emissor-1')).rejects.toMatchObject({ status: 403 })
    expect(authorization).toBeNull()
  })
})
