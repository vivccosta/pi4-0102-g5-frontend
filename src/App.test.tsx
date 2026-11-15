import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import { App } from './App'

describe('Roteamento da aplicação', () => {
  beforeEach(() => sessionStorage.clear())
  it('redireciona "/" para "/verificar"', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { level: 1, name: 'Verificar certificado' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Chave de autenticação' })).toBeInTheDocument()
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

  it('redireciona /emissor/painel para login sem sessão e preserva state.from', () => {
    render(
      <MemoryRouter initialEntries={['/emissor/painel']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Login do emissor' })).toBeInTheDocument()
  })

  it('redireciona /emissor/registrar para login sem sessão', () => {
    render(
      <MemoryRouter initialEntries={['/emissor/registrar']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Login do emissor' })).toBeInTheDocument()
  })

  it('redireciona /admin/emissores para login sem sessão', () => {
    render(
      <MemoryRouter initialEntries={['/admin/emissores']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Login do emissor' })).toBeInTheDocument()
  })

  it('redireciona emissor que acessa /admin para a home do perfil', () => {
    sessionStorage.setItem('timbro.sessao', JSON.stringify({
      token: 'token', nome: 'Emissor', perfil: 'EMISSOR', exp: Math.floor(Date.now() / 1000) + 3600,
    }))
    render(<MemoryRouter initialEntries={['/admin/emissores']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1, name: 'Painel do emissor' })).toBeInTheDocument()
  })

  it('redireciona administrador que acessa painel do emissor para sua home', () => {
    sessionStorage.setItem('timbro.sessao', JSON.stringify({
      token: 'token', nome: 'Admin', perfil: 'ADMINISTRADOR', exp: Math.floor(Date.now() / 1000) + 3600,
    }))
    render(<MemoryRouter initialEntries={['/emissor/painel']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1, name: 'Administração de emissores' })).toBeInTheDocument()
  })

  it('trata token expirado como ausência de sessão', () => {
    sessionStorage.setItem('timbro.sessao', JSON.stringify({
      token: 'token', nome: 'Emissor', perfil: 'EMISSOR', exp: Math.floor(Date.now() / 1000) - 10,
    }))
    render(<MemoryRouter initialEntries={['/emissor/painel']}><App /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1, name: 'Login do emissor' })).toBeInTheDocument()
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
