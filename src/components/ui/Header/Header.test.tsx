import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { Header } from './Header'

describe('Header', () => {
  function renderHeader(initialEntry = '/') {
    return render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <Header />
      </MemoryRouter>,
    )
  }

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
})
