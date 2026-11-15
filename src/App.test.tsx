import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import { App } from './App'

describe('Roteamento da aplicação', () => {
  it('redireciona "/" para "/verificar"', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Verificar certificado' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Verificar certificado — em construção'),
    ).toBeInTheDocument()
  })

  it('renderiza "/verificar"', () => {
    render(
      <MemoryRouter initialEntries={['/verificar']}>
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Verificar certificado' }),
    ).toBeInTheDocument()
  })

  it('renderiza "/emissor/login"', () => {
    render(
      <MemoryRouter initialEntries={['/emissor/login']}>
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Login do emissor' }),
    ).toBeInTheDocument()
  })

  it('renderiza "/emissor/painel"', () => {
    render(
      <MemoryRouter initialEntries={['/emissor/painel']}>
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Painel do emissor' }),
    ).toBeInTheDocument()
  })

  it('renderiza "/emissor/registrar"', () => {
    render(
      <MemoryRouter initialEntries={['/emissor/registrar']}>
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Registro de certificado' }),
    ).toBeInTheDocument()
  })

  it('renderiza "/admin/emissores"', () => {
    render(
      <MemoryRouter initialEntries={['/admin/emissores']}>
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Administração de emissores' }),
    ).toBeInTheDocument()
  })

  it('renderiza 404 com link para "/verificar" para rota desconhecida', () => {
    render(
      <MemoryRouter initialEntries={['/rota-desconhecida']}>
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Página não encontrada' }),
    ).toBeInTheDocument()
    const link = screen.getByRole('link', {
      name: 'Voltar para a verificação de certificados',
    })
    expect(link).toHaveAttribute('href', '/verificar')
  })
})
