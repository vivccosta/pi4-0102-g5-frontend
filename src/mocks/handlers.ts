import { delay, http, HttpResponse, type HttpHandler } from 'msw'
import { erroEnvelope, gerarMockJwt } from './helpers'

const certificadosMock = [
  {
    certificadoId: 1,
    nomeAluno: 'Ana Exemplo',
    hash: '0x7f83a1c4d2e6b809',
    dataEmissao: '2026-10-14T09:30:00',
    status: 'VALIDO',
    curso: 'Sistemas de Informação',
  },
  {
    certificadoId: 2,
    nomeAluno: 'Bruno Exemplo',
    hash: '0xabcd1234ef567890',
    dataEmissao: '2026-10-15T12:45:00.123456',
    status: 'INVALIDO',
  },
]

const emissoresPendentesIniciais = [
  { emissorId: 1, nome: 'Instituto Aurora', email: 'contato@aurora.timbro.test', cnpj: '12345678000195', status: 'PENDENTE' },
  { emissorId: 2, nome: 'Marina Exemplo', email: 'marina@timbro.test', cnpj: '11222333000181', status: 'PENDENTE' },
  { emissorId: 3, nome: 'Centro Horizonte', email: 'secretaria@horizonte.timbro.test', cnpj: '04252011000110', status: 'PENDENTE' },
]
let emissoresPendentesMock = emissoresPendentesIniciais.map((emissor) => ({ ...emissor }))

export function resetMockEmissores(): void {
  emissoresPendentesMock = emissoresPendentesIniciais.map((emissor) => ({ ...emissor }))
}

export function resetMockCertificados(): void {
  certificadosMock.forEach((certificado, index) => {
    certificado.status = index === 0 ? 'VALIDO' : 'INVALIDO'
  })
}

/**
 * Handlers do MSW para simulação dos contratos do Backend 1.
 */
export const handlers: HttpHandler[] = [
  http.get('*/api/admin/emissores/pendentes', ({ request }) => {
    const authorization = request.headers.get('Authorization')
    if (!authorization) return new HttpResponse(null, { status: 403 })
    if (authorization === 'Bearer token-401') return erroEnvelope(401, 'Sua sessão expirou. Entre novamente.')
    if (authorization === 'Bearer token-403') return erroEnvelope(403, 'Acesso negado.')
    if (authorization === 'Bearer token-500') return erroEnvelope(500, 'Falha interna.')
    if (authorization === 'Bearer token-vazio') return HttpResponse.json([])
    return HttpResponse.json(emissoresPendentesMock.map((emissor) => ({ ...emissor })))
  }),
  http.put('*/api/admin/emissores/:emissorId/status', async ({ request, params }) => {
    const authorization = request.headers.get('Authorization')
    if (!authorization) return new HttpResponse(null, { status: 403 })
    if (authorization === 'Bearer token-401') return erroEnvelope(401, 'Sua sessão expirou. Entre novamente.')
    if (authorization === 'Bearer token-403') return erroEnvelope(403, 'Acesso negado.')
    const emissorId = String(params.emissorId)
    if (emissorId === '404') return erroEnvelope(404, 'Emissor não encontrado.')
    if (emissorId === '400') return erroEnvelope(400, 'Status inválido.')
    if (emissorId === '500') return erroEnvelope(500, 'Falha interna.')
    const body: unknown = await request.json().catch(() => null)
    if (!body || typeof body !== 'object' || (body as Record<string, unknown>).novoStatus !== 'ATIVO') {
      return erroEnvelope(400, 'Status inválido.')
    }
    emissoresPendentesMock = emissoresPendentesMock.filter((emissor) => String(emissor.emissorId) !== emissorId)
    return new HttpResponse('Emissor ativado.', { status: 200, headers: { 'Content-Type': 'text/plain' } })
  }),
  // CT15: histórico de certificados autenticado do emissor.
  http.get('*/api/emissores/:emissorId/certificados', ({ request, params }) => {
    const authorization = request.headers.get('Authorization')
    if (!authorization) return new HttpResponse(null, { status: 403 })
    if (authorization === 'Bearer token-401') {
      return erroEnvelope(401, 'Sua sessão expirou. Entre novamente.')
    }
    if (authorization === 'Bearer token-403') {
      return erroEnvelope(403, 'Acesso negado. Você só pode visualizar o seu próprio histórico.')
    }
    if (authorization === 'Bearer token-500' || params.emissorId === 'emissor-erro-500') {
      return erroEnvelope(500, 'Falha interna.')
    }
    if (params.emissorId === 'emissor-vazio') return HttpResponse.json([])

    return HttpResponse.json(certificadosMock.map((certificado) => ({ ...certificado })))
  }),
  // CT19: revogação autenticada do certificado pelo emissor dono.
  http.post('*/api/certificados/:certificadoId/revogar', async ({ request, params }) => {
    const authorization = request.headers.get('Authorization')
    if (!authorization) return new HttpResponse(null, { status: 403 })
    if (authorization === 'Bearer token-401') {
      return erroEnvelope(401, 'Sua sessão expirou. Entre novamente.')
    }
    if (authorization === 'Bearer token-403') {
      return erroEnvelope(403, 'Você não tem permissão para revogar este certificado.')
    }

    const certificadoId = String(params.certificadoId)
    if (certificadoId === '404') return erroEnvelope(404, 'Certificado não encontrado.')
    if (certificadoId === '403') return erroEnvelope(403, 'Você não tem permissão para revogar este certificado.')
    if (certificadoId === '400') return erroEnvelope(400, 'Este certificado já se encontra revogado.')
    if (certificadoId === '500') return erroEnvelope(500, 'Falha na comunicação com a blockchain.')
    if (certificadoId === '21') await delay(21_000)

    const certificado = certificadosMock.find((item) => String(item.certificadoId) === certificadoId)
    if (!certificado) return erroEnvelope(404, 'Certificado não encontrado.')
    certificado.status = 'INVALIDO'
    return HttpResponse.json({ sucesso: true, mensagem: 'Certificado revogado com sucesso.' })
  }),
  // CT4/CT8: registro autenticado de certificado.
  http.post('*/api/certificados/registrar', async ({ request }) => {
    const authorization = request.headers.get('Authorization')
    if (!authorization) return new HttpResponse(null, { status: 403 })
    if (authorization === 'Bearer token-401') {
      return erroEnvelope(401, 'Sua sessão expirou. Entre novamente.')
    }
    if (authorization === 'Bearer token-403') {
      return erroEnvelope(403, 'Você não tem permissão para registrar este certificado.')
    }

    let body: unknown
    try {
      body = await request.json()
    } catch {
      return erroEnvelope(400, 'Corpo da requisição inválido.')
    }
    if (!body || typeof body !== 'object') return erroEnvelope(400, 'Dados do certificado inválidos.')
    const dados = body as Record<string, unknown>
    if (dados.curso === 'mock-erro-400') return erroEnvelope(400, 'Verifique os dados do certificado.')
    if (dados.curso === 'mock-erro-500') return erroEnvelope(500, 'Falha interna.')
    if (
      typeof dados.nomeAluno !== 'string' || !dados.nomeAluno.trim() ||
      typeof dados.cpfAluno !== 'string' || !/^\d{11}$/.test(dados.cpfAluno) ||
      typeof dados.curso !== 'string' || !dados.curso.trim() ||
      typeof dados.cargaHoraria !== 'number' || !Number.isInteger(dados.cargaHoraria) || dados.cargaHoraria < 1 ||
      typeof dados.dataConclusao !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dados.dataConclusao)
    ) return erroEnvelope(400, 'Dados do certificado inválidos.')

    return HttpResponse.json({
      sucesso: true,
      mensagem: 'Certificado registrado com sucesso.',
      hash: `0x${'a'.repeat(64)}`,
    })
  }),
  // CT9/CT14: validação pública por chave (sem Authorization)
  http.post('*/api/certificados/validar', async ({ request }) => {
    const body = await request.formData()
    const chave = String(body.get('chaveAutenticacao') ?? '').replace(/[\s\r\n]+/g, '').trim()
    if (chave === 'erro500') return erroEnvelope(500, 'Falha interna.')
    if (chave === 'lento') await new Promise((resolve) => setTimeout(resolve, 21_000))
    if (chave === 'chave-revogada') {
      return HttpResponse.json({ valido: false, mensagem: 'Certificado inválido: Certificado revogado.', nomeAluno: null, curso: null, dataConclusao: null, hash: null })
    }
    if (chave === 'chave-desconhecida') {
      return HttpResponse.json({ valido: false, mensagem: 'Certificado inválido: Chave de autenticação desconhecida.', nomeAluno: null, curso: null, dataConclusao: null, hash: null })
    }
    if (chave === 'chave-exemplo') {
      return HttpResponse.json({ valido: true, mensagem: 'Certificado válido.', nomeAluno: 'Ana Exemplo', curso: 'Sistemas de Informação', dataConclusao: '2026-10-14', hash: '0x7f83a1c4d2e6b809' })
    }
    return HttpResponse.json({ valido: false, mensagem: 'Certificado inválido: Chave de autenticação desconhecida.', nomeAluno: null, curso: null, dataConclusao: null, hash: null })
  }),
  // CT1/CT3: POST /api/auth/login
  http.post('*/api/auth/login', async ({ request }) => {
    let body: { email?: string; senha?: string }
    try {
      body = (await request.json()) as { email?: string; senha?: string }
    } catch {
      return erroEnvelope(400, 'Corpo da requisição inválido.')
    }

    const email = body.email?.trim()
    const senha = body.senha?.trim()

    if (!email || !senha) {
      return erroEnvelope(400, 'E-mail e senha são obrigatórios.')
    }

    // 1. Emissor ativo
    if (email === 'emissor@timbro.test' && senha === 'Senha@123') {
      const token = gerarMockJwt({
        sub: 'emissor@timbro.test',
        id: 1,
        perfil: 'EMISSOR',
        nome: 'Emissor Demonstração',
      })
      return HttpResponse.json({
        token,
        nome: 'Emissor Demonstração',
        perfil: 'EMISSOR',
      })
    }

    // 2. Administrador
    if (email === 'admin@timbro.test' && senha === 'Senha@123') {
      const token = gerarMockJwt({
        sub: 'admin@timbro.test',
        id: 99,
        perfil: 'ADMINISTRADOR',
        nome: 'Administrador Timbro',
      })
      return HttpResponse.json({
        token,
        nome: 'Administrador Timbro',
        perfil: 'ADMINISTRADOR',
      })
    }

    // 3. Emissor pendente
    if (
      (email === 'pendente@timbro.test' || email === 'emissor.pendente@timbro.test') &&
      senha === 'Senha@123'
    ) {
      return erroEnvelope(
        401,
        'Acesso não autorizado. O cadastro do emissor ainda está pendente.',
      )
    }

    // 4. Qualquer outra credencial (padrão CT1/CT3)
    return erroEnvelope(
      401,
      'Acesso não autorizado. Apenas emissores cadastrados podem acessar esta área.',
    )
  }),
  // Cadastro público de emissor. A senha e os dados informados não são persistidos no mock.
  http.post('*/api/emissores/cadastrar', async ({ request }) => {
    let body: unknown
    try {
      body = await request.json()
    } catch {
      return erroEnvelope(400, 'Dados do cadastro inválidos.')
    }
    if (!body || typeof body !== 'object') return erroEnvelope(400, 'Dados do cadastro inválidos.')
    const dados = body as Record<string, unknown>
    if (typeof dados.email === 'string' && dados.email.toLowerCase() === 'cadastrado@timbro.test') {
      return erroEnvelope(400, 'Email já cadastrado.')
    }
    if (
      typeof dados.nome !== 'string' || !dados.nome.trim() ||
      typeof dados.email !== 'string' || !dados.email.includes('@') ||
      typeof dados.cnpj !== 'string' || !/^\d{14}$/.test(dados.cnpj) ||
      typeof dados.senha !== 'string' || dados.senha.length < 8
    ) return erroEnvelope(400, 'Dados do cadastro inválidos.')
    if (dados.email === 'erro500@timbro.test') return erroEnvelope(500, 'Falha interna.')
    return new HttpResponse(
      'Cadastro realizado com sucesso. Aguardando aprovação do administrador.',
      { status: 201, headers: { 'Content-Type': 'text/plain' } },
    )
  }),
]
