import { http, HttpResponse, type HttpHandler } from 'msw'
import { erroEnvelope, gerarMockJwt } from './helpers'

/**
 * Handlers do MSW para simulação dos contratos do Backend 1.
 */
export const handlers: HttpHandler[] = [
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
