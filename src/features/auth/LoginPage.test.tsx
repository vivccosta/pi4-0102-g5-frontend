import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { AuthProvider } from './AuthProvider'
import { LoginPage } from './LoginPage'

function renderLogin({
  initialEntries = ['/emissor/login'],
  initialSession,
}: {
  initialEntries?: Array<string | { pathname: string; state?: unknown }>
  initialSession?: {
    token: string
    nome: string
    perfil: 'EMISSOR' | 'ADMINISTRADOR'
    exp: number
  }
} = {}) {
  if (initialSession) {
    sessionStorage.setItem('timbro.sessao', JSON.stringify(initialSession))
  }

  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Routes>
          <Route path="/emissor/login" element={<LoginPage />} />
          <Route path="/emissor/painel" element={<div>Página do Painel</div>} />
          <Route path="/emissor/registrar" element={<div>Página de Registro</div>} />
          <Route path="/admin/emissores" element={<div>Página Admin</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('LoginPage (CT1/CT3)', () => {
  beforeEach(() => {
    window.__TIMBRO_CONFIG__ = { apiUrl: 'http://localhost:8080' }
    sessionStorage.clear()
  })

  afterEach(() => {
    sessionStorage.clear()
  })

  it('renderiza os campos com atributos de acessibilidade e autocomplete', () => {
    renderLogin()

    const emailInput = screen.getByLabelText(/e-mail/i)
    const senhaInput = screen.getByLabelText(/senha/i)
    const submitBtn = screen.getByRole('button', { name: /entrar/i })

    expect(emailInput).toHaveAttribute('type', 'email')
    expect(emailInput).toHaveAttribute('autocomplete', 'username')
    expect(senhaInput).toHaveAttribute('type', 'password')
    expect(senhaInput).toHaveAttribute('autocomplete', 'current-password')
    expect(submitBtn).toBeInTheDocument()
  })

  it('valida campos obrigatórios no cliente sem chamar a API', async () => {
    const user = userEvent.setup()
    renderLogin()

    const submitBtn = screen.getByRole('button', { name: /entrar/i })
    await user.click(submitBtn)

    expect(await screen.findByText('O e-mail é obrigatório')).toBeInTheDocument()
    expect(await screen.findByText('A senha é obrigatória')).toBeInTheDocument()
  })

  it('realiza login com sucesso como EMISSOR e navega para /emissor/painel', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/e-mail/i), 'emissor@timbro.test')
    await user.type(screen.getByLabelText(/senha/i), 'Senha@123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText('Página do Painel')).toBeInTheDocument()
    const stored = JSON.parse(sessionStorage.getItem('timbro.sessao') || '{}')
    expect(stored.perfil).toBe('EMISSOR')
    expect(stored.nome).toBe('Emissor Demonstração')
  })

  it('realiza login com sucesso como ADMINISTRADOR e navega para /admin/emissores', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/e-mail/i), 'admin@timbro.test')
    await user.type(screen.getByLabelText(/senha/i), 'Senha@123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText('Página Admin')).toBeInTheDocument()
    const stored = JSON.parse(sessionStorage.getItem('timbro.sessao') || '{}')
    expect(stored.perfil).toBe('ADMINISTRADOR')
  })

  it('redireciona para state.from após login bem-sucedido quando perfil tem permissão', async () => {
    const user = userEvent.setup()
    renderLogin({
      initialEntries: [
        {
          pathname: '/emissor/login',
          state: { from: '/emissor/registrar' },
        },
      ],
    })

    await user.type(screen.getByLabelText(/e-mail/i), 'emissor@timbro.test')
    await user.type(screen.getByLabelText(/senha/i), 'Senha@123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    expect(await screen.findByText('Página de Registro')).toBeInTheDocument()
  })

  it('redireciona para a home do perfil se state.from não for permitido para aquele perfil', async () => {
    const user = userEvent.setup()
    renderLogin({
      initialEntries: [
        {
          pathname: '/emissor/login',
          state: { from: '/admin/emissores' },
        },
      ],
    })

    // Loga com EMISSOR (não tem acesso a /admin)
    await user.type(screen.getByLabelText(/e-mail/i), 'emissor@timbro.test')
    await user.type(screen.getByLabelText(/senha/i), 'Senha@123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    // Deve ir para /emissor/painel e não para /admin/emissores
    expect(await screen.findByText('Página do Painel')).toBeInTheDocument()
  })

  it('exibe alerta com role="alert" em caso de 401 com cadastro pendente', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/e-mail/i), 'pendente@timbro.test')
    await user.type(screen.getByLabelText(/senha/i), 'Senha@123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(
      'Acesso não autorizado. O cadastro do emissor ainda está pendente.',
    )
  })

  it('exibe mensagem padrão em caso de 401 para credenciais inválidas', async () => {
    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/e-mail/i), 'outro@timbro.test')
    await user.type(screen.getByLabelText(/senha/i), 'Incorreta123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(
      'Acesso não autorizado. Apenas emissores cadastrados podem acessar esta área.',
    )
  })

  it('exibe mensagem genérica amigável em caso de erro 500 do servidor', async () => {
    server.use(
      http.post('*/api/auth/login', () => {
        return HttpResponse.json(
          { mensagem: 'Erro interno no banco de dados' },
          { status: 500 },
        )
      }),
    )

    const user = userEvent.setup()
    renderLogin()

    await user.type(screen.getByLabelText(/e-mail/i), 'emissor@timbro.test')
    await user.type(screen.getByLabelText(/senha/i), 'Senha@123')
    await user.click(screen.getByRole('button', { name: /entrar/i }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent(
      'Não foi possível concluir a operação agora. Tente novamente em instantes.',
    )
    expect(alert).not.toHaveTextContent('banco de dados')
  })

  it('exibe aviso de sessão expirada quando recebido via state.expirou', () => {
    renderLogin({
      initialEntries: [
        {
          pathname: '/emissor/login',
          state: { expirou: true },
        },
      ],
    })

    expect(screen.getByText('Sua sessão expirou. Entre novamente.')).toBeInTheDocument()
  })

  it('redireciona automaticamente para a home do perfil se já houver sessão ativa', async () => {
    const agora = Math.floor(Date.now() / 1000)
    renderLogin({
      initialSession: {
        token: 'token-valido',
        nome: 'Emissor Ativo',
        perfil: 'EMISSOR',
        exp: agora + 3600,
      },
    })

    await waitFor(() => {
      expect(screen.getByText('Página do Painel')).toBeInTheDocument()
    })
  })
})
