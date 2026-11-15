import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registrarCertificado } from '@/api/certificados'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { saveSession } from '@/lib/session'
import { RegistroPage } from './RegistroPage'

vi.mock('@/api/certificados', () => ({ registrarCertificado: vi.fn() }))
vi.mock('@/lib/clipboard', () => ({ copyToClipboard: vi.fn().mockResolvedValue(true) }))

const registroMock = vi.mocked(registrarCertificado)

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider><RegistroPage /></AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

async function preencherFormulario(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('textbox', { name: 'Nome completo do aluno' }), 'Ana Exemplo')
  await user.type(screen.getByRole('textbox', { name: 'CPF do aluno' }), '52998224725')
  await user.type(screen.getByRole('textbox', { name: 'Curso' }), 'Sistemas de Informação')
  await user.type(screen.getByRole('spinbutton', { name: 'Carga horária (horas)' }), '120')
  await user.type(screen.getByLabelText(/Data de conclusão/), '2026-10-14')
}

beforeEach(() => {
  sessionStorage.clear()
  saveSession({ token: 'token-teste', nome: 'Emissor', perfil: 'EMISSOR', emissorId: 'emissor-1', exp: Math.floor(Date.now() / 1000) + 3600 })
  registroMock.mockReset()
})

describe('tela de sucesso do registro', () => {
  it('mostra o texto exato e permite copiar a chave completa', async () => {
    const user = userEvent.setup()
    const hash = `0x${'b'.repeat(64)}`
    registroMock.mockResolvedValue({ sucesso: true, mensagem: 'Registro realizado.', hash })
    renderPage()
    await preencherFormulario(user)
    await user.dblClick(screen.getByRole('button', { name: 'Registrar e gerar código' }))
    expect(await screen.findByText(`Registro realizado com sucesso! Hash: ${hash}`)).toBeInTheDocument()
    expect(screen.getByLabelText(`Chave completa: ${hash}`)).toHaveTextContent(hash)
    expect(registroMock).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('button', { name: 'Copiar' }))
    expect(await screen.findByRole('button', { name: 'Copiado!' })).toBeInTheDocument()
    expect(screen.getByText('A chave também fica disponível no painel de certificados.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver meus certificados' })).toHaveAttribute('href', '/emissor/painel')
  })

  it('limpa os dados, inclusive o CPF, ao iniciar outro registro', async () => {
    const user = userEvent.setup()
    registroMock.mockResolvedValue({ sucesso: true, mensagem: 'Registro realizado.', hash: '0xchave' })
    renderPage()
    await preencherFormulario(user)
    await user.click(screen.getByRole('button', { name: 'Registrar e gerar código' }))
    await user.click(await screen.findByRole('button', { name: 'Registrar outro certificado' }))
    expect(screen.getByRole('textbox', { name: 'Nome completo do aluno' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'CPF do aluno' })).toHaveValue('')
    expect(screen.getByRole('textbox', { name: 'Curso' })).toHaveValue('')
    expect(screen.getByRole('spinbutton', { name: 'Carga horária (horas)' })).toHaveValue(null)
    expect(screen.getByLabelText(/Data de conclusão/)).toHaveValue('')
  })
})
