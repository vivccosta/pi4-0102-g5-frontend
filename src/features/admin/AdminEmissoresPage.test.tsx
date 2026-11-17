import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { server } from '@/mocks/server'
import { resetMockEmissores } from '@/mocks/handlers'
import { saveSession } from '@/lib/session'
import { App } from '@/App'
import { AdminEmissoresPage } from './AdminEmissoresPage'

function renderAdmin() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter><AdminEmissoresPage /></MemoryRouter>
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  sessionStorage.clear()
  window.__TIMBRO_CONFIG__ = { apiUrl: 'http://localhost:8080' }
  resetMockEmissores()
  saveSession({ token: 'admin-token', nome: 'Admin', perfil: 'ADMINISTRADOR', emissorId: 'admin-1', exp: Math.floor(Date.now() / 1000) + 3600 })
})

describe('AdminEmissoresPage', () => {
  it('lista dados, formata CNPJ e avisa quando a documentação não está disponível', async () => {
    renderAdmin()
    expect(await screen.findByRole('heading', { name: 'Emissores pendentes' })).toBeInTheDocument()
    expect(await screen.findByText('12.345.678/0001-95')).toBeInTheDocument()
    expect(screen.getByText('11.222.333/0001-81')).toBeInTheDocument()
    expect(screen.getByText('04.252.011/0001-10')).toBeInTheDocument()
    expect(screen.getAllByText('Pendente')).toHaveLength(3)
    expect(screen.getAllByText('Documentação não disponível na API ainda.')).toHaveLength(3)
  })

  it('após aprovação, remove o emissor e anuncia a mensagem própria', async () => {
    const user = userEvent.setup()
    renderAdmin()
    await screen.findByText('Instituto Aurora')
    const firstApprove = screen.getAllByRole('button', { name: 'Aprovar' })[0]
    if (!firstApprove) throw new Error('Botão Aprovar não encontrado')
    await user.click(firstApprove)
    expect(await screen.findByRole('status')).toHaveTextContent('Emissor ativado com sucesso')
    await waitFor(() => expect(screen.queryByText('Instituto Aurora')).not.toBeInTheDocument())
    expect(screen.getAllByRole('button', { name: 'Aprovar' })).toHaveLength(2)
  })

  it('mantém item após erro e permite tentar novamente na listagem', async () => {
    let tentativas = 0
    server.use(http.get('*/api/admin/emissores/pendentes', () => {
      tentativas += 1
      return tentativas === 1
        ? HttpResponse.json({ status: 500, mensagem: 'Erro interno.' }, { status: 500 })
        : HttpResponse.json([])
    }))
    renderAdmin()
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível concluir a operação agora. Tente novamente em instantes.')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Nenhum emissor pendente.')).toBeInTheDocument()
    expect(tentativas).toBe(2)
  })

  it('renderiza links http(s) seguros e exibe HTML como texto', async () => {
    server.use(http.get('*/api/admin/emissores/pendentes', () => HttpResponse.json([
      { emissorId: 4, nome: 'Instituto Docs', email: 'docs@timbro.test', cnpj: '11222333000181', status: 'PENDENTE', documentacao: ['https://example.test/doc', '<img src=x onerror=alert(1)>', 'javascript:alert(1)'] },
    ])))
    renderAdmin()
    const link = await screen.findByRole('link', { name: 'https://example.test/doc' })
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument()
    expect(screen.getByText('javascript:alert(1)')).toBeInTheDocument()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('não remove emissor em erro de aprovação', async () => {
    server.use(http.put('*/api/admin/emissores/:id/status', () => HttpResponse.json(
      { status: 404, mensagem: 'Emissor não encontrado.' }, { status: 404 },
    )))
    renderAdmin()
    await screen.findByText('Instituto Aurora')
    const firstApprove = screen.getAllByRole('button', { name: 'Aprovar' })[0]
    if (!firstApprove) throw new Error('Botão Aprovar não encontrado')
    await userEvent.setup().click(firstApprove)
    expect(await screen.findByText('Emissor não encontrado.')).toBeInTheDocument()
    expect(screen.getByText('Instituto Aurora')).toBeInTheDocument()
  })

  it('redireciona emissor e visitante sem sessão ao tentar abrir a tela administrativa', async () => {
    sessionStorage.setItem('timbro.sessao', JSON.stringify({ token: 'token', nome: 'Emissor', perfil: 'EMISSOR', exp: Math.floor(Date.now() / 1000) + 3600 }))
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const { unmount } = render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={['/admin/emissores']}><App /></MemoryRouter></QueryClientProvider>)
    expect(await screen.findByRole('heading', { name: 'Meus certificados' })).toBeInTheDocument()
    unmount()
    sessionStorage.clear()
    render(<QueryClientProvider client={queryClient}><MemoryRouter initialEntries={['/admin/emissores']}><App /></MemoryRouter></QueryClientProvider>)
    expect(await screen.findByRole('heading', { name: 'Login do emissor' })).toBeInTheDocument()
  })
})
