import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { saveSession } from '@/lib/session'
import { server } from '@/mocks/server'
import { PainelPage } from './PainelPage'

function renderPainel() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <MemoryRouter initialEntries={['/emissor/painel']}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Routes>
            <Route path="/emissor/painel" element={<PainelPage />} />
            <Route path="/emissor/registrar" element={<h1>Registro</h1>} />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  )
}

function iniciarSessao(emissorId = 'emissor-uuid-1', token = 'token-teste') {
  saveSession({
    token,
    nome: 'Emissor Demonstração',
    perfil: 'EMISSOR',
    emissorId,
    exp: Math.floor(Date.now() / 1000) + 3600,
  })
}

beforeEach(() => {
  sessionStorage.clear()
  window.__TIMBRO_CONFIG__ = { apiUrl: 'http://localhost:8080' }
  iniciarSessao()
})

describe('PainelPage', () => {
  it('mostra os certificados ordenados e os campos formatados', async () => {
    renderPainel()
    const tabela = await screen.findByRole('table')
    const linhas = within(tabela).getAllByRole('row')

    expect(screen.getByRole('heading', { name: 'Meus certificados' })).toBeInTheDocument()
    expect(linhas[1]).toHaveTextContent('Bruno Exemplo')
    expect(linhas[1]).toHaveTextContent('—')
    expect(linhas[1]).toHaveTextContent('15/10/2026 12:45')
    expect(linhas[1]).toHaveTextContent('Revogado')
    expect(linhas[2]).toHaveTextContent('Ana Exemplo')
    expect(linhas[2]).toHaveTextContent('Sistemas de Informação')
    expect(linhas[2]).toHaveTextContent('14/10/2026 09:30')
    expect(linhas[2]).toHaveTextContent('Válido')
    expect(within(linhas[2]!).getByText('0x7f83…b809')).toHaveAttribute(
      'aria-label', 'Chave completa: 0x7f83a1c4d2e6b809',
    )
    expect(within(linhas[2]!).getByRole('button', { name: 'Copiar' })).toBeInTheDocument()
  })

  it('usa o emissorId da sessão na URL da consulta', async () => {
    iniciarSessao('emissor-com-id-especial')
    let urlConsultada = ''
    server.use(http.get('*/api/emissores/:emissorId/certificados', ({ request }) => {
      urlConsultada = request.url
      return HttpResponse.json([])
    }))
    renderPainel()
    expect(await screen.findByText('Você ainda não registrou nenhum certificado.')).toBeInTheDocument()
    expect(urlConsultada).toContain('/api/emissores/emissor-com-id-especial/certificados')
  })

  it('não chama a API sem token ou emissorId', async () => {
    sessionStorage.clear()
    let chamadas = 0
    server.use(http.get('*/api/emissores/:emissorId/certificados', () => {
      chamadas += 1
      return HttpResponse.json([])
    }))
    renderPainel()
    expect(await screen.findByText('Carregando certificados…')).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(chamadas).toBe(0)
  })

  it('mostra estado vazio e permite abrir o registro', async () => {
    iniciarSessao('emissor-vazio')
    const user = userEvent.setup()
    renderPainel()
    expect(await screen.findByText('Você ainda não registrou nenhum certificado.')).toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Registrar certificado' })[0]!)
    expect(await screen.findByRole('heading', { name: 'Registro' })).toBeInTheDocument()
  })

  it('mostra erro amigável no 500 e tenta novamente', async () => {
    iniciarSessao('emissor-erro-500')
    const user = userEvent.setup()
    renderPainel()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível concluir a operação agora. Tente novamente em instantes.',
    )
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
  })

  it('exibe a mensagem de negócio recebida no 403', async () => {
    iniciarSessao('emissor-uuid-1', 'token-403')
    renderPainel()
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Acesso negado. Você só pode visualizar o seu próprio histórico.',
    )
  })
})
