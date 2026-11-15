import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { Header } from './Header'

describe('Header', () => {
  function renderHeader(initialEntry = '/') {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <AuthProvider><Header /></AuthProvider>
      </MemoryRouter>,
    )
  }

  beforeEach(() => sessionStorage.clear())

  it('renderiza o wordmark "Timbro"', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: /Timbro/i })).toBeInTheDocument()
  })

  it('contém link "Verificar certificado"', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: 'Verificar certificado' })).toBeInTheDocument()
  })

  it('contém link "Área do emissor"', () => {
    renderHeader()
    expect(screen.getByRole('link', { name: 'Área do emissor' })).toBeInTheDocument()
  })

  it('tem nav com label "Navegação principal"', () => {
    renderHeader()
    expect(screen.getByRole('navigation', { name: 'Navegação principal' })).toBeInTheDocument()
  })

  it('links são acessíveis por teclado (focusable)', () => {
    renderHeader()
    const links = screen.getAllByRole('link')
    links.forEach((link) => {
      expect(link.tagName).toBe('A')
    })
  })

  it('mostra nome, navegação do perfil e sair quando há sessão', () => {
    sessionStorage.setItem('timbro.sessao', JSON.stringify({
      token: 'token', nome: 'Emissora Exemplo', perfil: 'EMISSOR',
      exp: Math.floor(Date.now() / 1000) + 3600,
    }))
    renderHeader()
    expect(screen.getByText('Emissora Exemplo')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Painel' })).toHaveAttribute('href', '/emissor/painel')
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Área do emissor' })).not.toBeInTheDocument()
  })
})
