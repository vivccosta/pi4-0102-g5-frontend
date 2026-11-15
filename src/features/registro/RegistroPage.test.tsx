import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/errors'
import { registrarCertificado } from '@/api/certificados'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { saveSession } from '@/lib/session'
import { RegistroPage } from './RegistroPage'
import { toRegistroPayload } from './registroMapper'

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

describe('RegistroPage', () => {
  it('mapeia CPF sem máscara e mantém carga numérica e data ISO', () => {
    expect(toRegistroPayload({
      nomeAluno: 'Ana Exemplo',
      cpfAluno: '529.982.247-25',
      curso: 'Sistemas de Informação',
      cargaHoraria: 120,
      dataConclusao: '2026-10-14',
    })).toEqual({
      nomeAluno: 'Ana Exemplo',
      cpfAluno: '52998224725',
      curso: 'Sistemas de Informação',
      cargaHoraria: 120,
      dataConclusao: '2026-10-14',
    })
  })

  it('mostra erros de todos os campos vazios e não chama a API', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Registrar e gerar código' }))
    expect(await screen.findByText('Informe o nome completo do aluno.')).toBeInTheDocument()
    expect(screen.getByText('Informe o CPF do aluno.')).toBeInTheDocument()
    expect(screen.getByText('Informe o curso.')).toBeInTheDocument()
    expect(screen.getByText('Informe a carga horária.')).toBeInTheDocument()
    expect(screen.getByText('Informe a data de conclusão.')).toBeInTheDocument()
    expect(registroMock).not.toHaveBeenCalled()
  })

  it('valida nome completo, dígitos do CPF, inteiro positivo e data existente', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByRole('textbox', { name: 'Nome completo do aluno' }), 'Ana')
    await user.type(screen.getByRole('textbox', { name: 'CPF do aluno' }), '11111111111')
    await user.type(screen.getByRole('textbox', { name: 'Curso' }), 'Curso')
    await user.type(screen.getByRole('spinbutton', { name: 'Carga horária (horas)' }), '0')
    await user.type(screen.getByLabelText(/Data de conclusão/), '2026-02-28')
    await user.click(screen.getByRole('button', { name: 'Registrar e gerar código' }))
    expect(await screen.findByText('Informe o nome e o sobrenome do aluno.')).toBeInTheDocument()
    expect(screen.getByText('Informe um CPF válido.')).toBeInTheDocument()
    expect(screen.getByText('A carga horária deve ser maior que zero.')).toBeInTheDocument()
    expect(screen.queryByText('Informe uma data válida.')).not.toBeInTheDocument()
    expect(registroMock).not.toHaveBeenCalled()
  })

  it.each([
    [400, 'Verifique os dados enviados.'],
    [401, 'Sua sessão expirou. Entre novamente.'],
    [403, 'Você não tem permissão para registrar este certificado.'],
  ])('exibe a mensagem do backend no erro %s e preserva os campos', async (status, mensagem) => {
    const user = userEvent.setup()
    registroMock.mockRejectedValue(new ApiError('http', mensagem, status))
    renderPage()
    await preencherFormulario(user)
    await user.click(screen.getByRole('button', { name: 'Registrar e gerar código' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(mensagem)
    expect(screen.getByRole('textbox', { name: 'CPF do aluno' })).toHaveValue('529.982.247-25')
    expect(screen.getByRole('textbox', { name: 'Nome completo do aluno' })).toHaveValue('Ana Exemplo')
  })

  it.each([
    ['servidor', new ApiError('http', 'erro técnico', 500)],
    ['rede', new ApiError('rede', 'erro técnico')],
    ['timeout', new ApiError('timeout', 'erro técnico')],
  ])('usa mensagem amigável em falha de %s e preserva os dados', async (_tipo, erro) => {
    const user = userEvent.setup()
    registroMock.mockRejectedValue(erro)
    renderPage()
    await preencherFormulario(user)
    await user.click(screen.getByRole('button', { name: 'Registrar e gerar código' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível concluir a operação agora. Tente novamente em instantes.')
    expect(screen.getByRole('textbox', { name: 'CPF do aluno' })).toHaveValue('529.982.247-25')
    expect(registroMock).toHaveBeenCalledTimes(1)
  })
})
