import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { CadastroEmissorPage } from './CadastroEmissorPage'
import { LoginPage } from './LoginPage'
import { AuthProvider } from './AuthProvider'

function renderCadastro(initialEntry = '/emissor/cadastro') {
  return render(<MemoryRouter initialEntries={[initialEntry]}><AuthProvider><Routes>
    <Route path="/emissor/cadastro" element={<CadastroEmissorPage />} />
    <Route path="/emissor/login" element={<LoginPage />} />
  </Routes></AuthProvider></MemoryRouter>)
}

async function preencherCadastro(user: ReturnType<typeof userEvent.setup>, email = 'nova@timbro.test') {
  await user.type(screen.getByLabelText(/Nome do emissor/), 'Instituto Exemplo')
  await user.type(screen.getByLabelText(/E-mail/), email)
  await user.type(screen.getByLabelText(/CNPJ ou CPF/), '52998224725')
  await user.type(screen.getByLabelText(/^Senha/), 'senha123')
  await user.type(screen.getByLabelText(/Confirmar senha/), 'senha123')
}

describe('CadastroEmissorPage', () => {
  beforeEach(() => { window.__TIMBRO_CONFIG__ = { apiUrl: 'http://localhost:8080' } })
  afterEach(() => { sessionStorage.clear() })

  it('envia solicitação e mostra a mensagem de sucesso sem autenticar', async () => {
    const user = userEvent.setup()
    renderCadastro()
    await preencherCadastro(user)
    await user.click(screen.getByRole('button', { name: 'Solicitar cadastro' }))
    expect(await screen.findByText('Cadastro realizado com sucesso. Aguardando aprovação do administrador.')).toBeInTheDocument()
    expect(screen.getByText('O acesso depende da aprovação do administrador.')).toBeInTheDocument()
    expect(sessionStorage.getItem('timbro.sessao')).toBeNull()
  })

  it('valida dígito verificador e igualdade de senha no cliente', async () => {
    const user = userEvent.setup()
    renderCadastro()
    await preencherCadastro(user)
    await user.clear(screen.getByLabelText(/CNPJ ou CPF/))
    await user.type(screen.getByLabelText(/CNPJ ou CPF/), '12345678901')
    await user.clear(screen.getByLabelText(/Confirmar senha/))
    await user.type(screen.getByLabelText(/Confirmar senha/), 'diferente')
    await user.click(screen.getByRole('button', { name: 'Solicitar cadastro' }))
    expect(await screen.findByText('Informe um CPF ou CNPJ válido')).toBeInTheDocument()
    expect(screen.getByText('As senhas devem ser iguais')).toBeInTheDocument()
  })

  it('mostra erro de negócio 400 retornado pelo backend', async () => {
    const user = userEvent.setup()
    renderCadastro()
    await preencherCadastro(user, 'cadastrado@timbro.test')
    await user.click(screen.getByRole('button', { name: 'Solicitar cadastro' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Email já cadastrado.')
  })

  it('mostra erro amigável para indisponibilidade', async () => {
    server.use(http.post('*/api/emissores/cadastrar', () => HttpResponse.json({ mensagem: 'segredo interno' }, { status: 500 })))
    const user = userEvent.setup()
    renderCadastro()
    await preencherCadastro(user)
    await user.click(screen.getByRole('button', { name: 'Solicitar cadastro' }))
    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('Não foi possível concluir a operação agora. Tente novamente em instantes.')
    expect(alerta).not.toHaveTextContent('segredo interno')
  })

  it('apresenta links de navegação entre login e cadastro', async () => {
    const user = userEvent.setup()
    renderCadastro('/emissor/login')
    await user.click(screen.getByRole('link', { name: 'Solicitar cadastro' }))
    expect(await screen.findByRole('heading', { name: 'Solicitar cadastro de emissor' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Já tenho conta' }))
    expect(await screen.findByRole('heading', { name: 'Login do emissor' })).toBeInTheDocument()
  })
})
