import { http, HttpResponse, type HttpHandler } from 'msw'
import { erroEnvelope, gerarMockJwt } from './helpers'

/**
 * Handlers do MSW para simulação dos contratos do Backend 1.
 */
export const handlers: HttpHandler[] = [
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
      return HttpResponse.json({ valido: false, mensagem: 'Certificado inválido: Certificado revogado.' })
    }
    if (chave === 'chave-desconhecida') {
      return HttpResponse.json({ valido: false, mensagem: 'Certificado inválido: Chave de autenticação desconhecida.' })
    }
    if (chave === 'chave-exemplo') {
      return HttpResponse.json({ valido: true, mensagem: 'Certificado válido.', nomeAluno: 'Ana Exemplo', curso: 'Sistemas de Informação', dataConclusao: '2026-10-14', hash: '0x7f83a1c4d2e6b809' })
    }
    return HttpResponse.json({ valido: false, mensagem: 'Certificado inválido: Chave de autenticação desconhecida.' })
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
        id: 'emissor-uuid-1',
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
        id: 'admin-uuid-1',
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
]
