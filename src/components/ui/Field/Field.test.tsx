import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Field } from './Field'

describe('Field', () => {
  it('associa label ao input via htmlFor/id', () => {
    render(<Field label="Nome" />)
    expect(screen.getByLabelText('Nome')).toBeInTheDocument()
  })

  it('exibe asterisco acessível para required', () => {
    render(<Field label="E-mail" required />)
    // O span do asterisco está aria-hidden, mas o texto do label é "E-mail *"
    const input = screen.getByLabelText(/E-mail/)
    expect(input).toHaveAttribute('aria-required', 'true')
  })

  it('seta aria-invalid e role=alert quando há erro', () => {
    render(<Field label="Senha" error="Campo obrigatório" />)
    const input = screen.getByLabelText('Senha')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('alert')).toHaveTextContent('Campo obrigatório')
  })

  it('associa aria-describedby ao id do erro', () => {
    render(<Field label="CPF" error="CPF inválido" />)
    const input = screen.getByLabelText('CPF')
    const errorEl = screen.getByRole('alert')
    expect(input.getAttribute('aria-describedby')).toBe(errorEl.id)
  })

  it('exibe hint sem erro', () => {
    render(<Field label="CPF" hint="Somente números" />)
    expect(screen.getByText('Somente números')).toBeInTheDocument()
  })
})
