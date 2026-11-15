import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { server } from '@/mocks/server'
import { VerificarPage } from './VerificarPage'

function renderPage() {
  return render(<MemoryRouter><AuthProvider><VerificarPage /></AuthProvider></MemoryRouter>)
}

beforeEach(() => {
  window.__TIMBRO_CONFIG__ = { apiUrl: 'http://localhost:8080' }
})

describe('VerificarPage', () => {
  it('exibe resultado válido com data formatada e chave copiável', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByRole('textbox', { name: 'Chave de autenticação' }), 'chave-exemplo')
    await user.click(screen.getByRole('button', { name: 'Verificar certificado' }))
    expect(await screen.findByRole('heading', { name: 'Certificado válido' })).toBeInTheDocument()
    expect(screen.getByText('Ana Exemplo')).toBeInTheDocument()
    expect(screen.getByText('14/10/2026')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copiar' })).toBeInTheDocument()
    expect(screen.getAllByRole('status')[0]).toHaveFocus()
  })

  it.each([
    ['chave-revogada', 'Certificado revogado.'],
    ['chave-desconhecida', 'Chave de autenticação desconhecida.'],
  ])('exibe motivo inválido para %s sem repetir prefixo', async (chave, esperado) => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByRole('textbox', { name: 'Chave de autenticação' }), chave)
    await user.click(screen.getByRole('button', { name: 'Verificar certificado' }))
    expect(await screen.findByRole('heading', { name: 'Certificado inválido' })).toBeInTheDocument()
    expect(screen.getByText(esperado)).toBeInTheDocument()
  })

  it('trata 500 como indisponível, nunca como inválido', async () => {
    const user = userEvent.setup()
    renderPage()
    server.use(http.post('*/api/certificados/validar', () => HttpResponse.json({ status: 500, mensagem: 'Erro interno.' }, { status: 500 })))
    await user.type(screen.getByRole('textbox', { name: 'Chave de autenticação' }), 'erro500')
    await user.click(screen.getByRole('button', { name: 'Verificar certificado' }))
    expect(await screen.findByText(/Serviço indisponível/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Certificado inválido' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  })

  it('trata falha de rede como indisponível', async () => {
    const user = userEvent.setup()
    renderPage()
    server.use(http.post('*/api/certificados/validar', () => HttpResponse.error()))
    await user.type(screen.getByRole('textbox', { name: 'Chave de autenticação' }), 'chave')
    await user.click(screen.getByRole('button', { name: 'Verificar certificado' }))
    expect(await screen.findByText(/Isso não significa que o certificado seja inválido/)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Certificado inválido' })).not.toBeInTheDocument()
  })

  it('ignora duplo clique durante a mesma requisição', async () => {
    const user = userEvent.setup()
    let chamadas = 0
    server.use(http.post('*/api/certificados/validar', async () => {
      chamadas += 1
      await new Promise((resolve) => setTimeout(resolve, 50))
      return HttpResponse.json({ valido: false, mensagem: 'Certificado inválido: teste.' })
    }))
    renderPage()
    await user.type(screen.getByRole('textbox', { name: 'Chave de autenticação' }), 'chave')
    await user.dblClick(screen.getByRole('button', { name: 'Verificar certificado' }))
    await screen.findByRole('heading', { name: 'Certificado inválido' })
    expect(chamadas).toBe(1)
  })

  it('não chama a API com campo vazio', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: 'Verificar certificado' }))
    expect(screen.getByText('Informe a chave de autenticação.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Certificado inválido' })).not.toBeInTheDocument()
  })
})
