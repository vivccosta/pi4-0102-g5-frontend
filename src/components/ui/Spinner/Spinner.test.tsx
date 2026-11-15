import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Spinner } from './Spinner'

describe('Spinner', () => {
  it('tem role=status com texto acessível padrão', () => {
    render(<Spinner />)
    const el = screen.getByRole('status')
    expect(el).toBeInTheDocument()
    expect(el).toHaveTextContent('Carregando…')
  })

  it('usa label personalizado', () => {
    render(<Spinner label="Aguardando resposta" />)
    expect(screen.getByRole('status')).toHaveTextContent('Aguardando resposta')
  })
})
