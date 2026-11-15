import { http, HttpResponse, type HttpHandler } from 'msw'
import { erroEnvelope, gerarMockJwt } from './helpers'

/**
 * Handlers do MSW para simulação dos contratos do Backend 1.
 */
export const handlers: HttpHandler[] = [
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
