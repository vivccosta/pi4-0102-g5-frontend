import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Alert } from './Alert'

describe('Alert', () => {
  it('usa role=alert para error', () => {
    render(<Alert variant="error">Algo deu errado</Alert>)
    expect(screen.getByRole('alert')).toHaveTextContent('Algo deu errado')
  })

  it('usa role=status para success', () => {
    render(<Alert variant="success">Operação concluída</Alert>)
    expect(screen.getByRole('status')).toHaveTextContent('Operação concluída')
  })

  it('usa role=status para info', () => {
    render(<Alert variant="info">Informação</Alert>)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('usa role=alert para warning', () => {
    render(<Alert variant="warning">Atenção</Alert>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renderiza título quando fornecido', () => {
    render(<Alert variant="error" title="Erro de rede">Tente novamente</Alert>)
    expect(screen.getByText('Erro de rede')).toBeInTheDocument()
    expect(screen.getByText('Tente novamente')).toBeInTheDocument()
  })
})
