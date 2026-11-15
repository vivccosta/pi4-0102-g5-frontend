import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'

describe('Button', () => {
  it('renderiza o texto do filho', () => {
    render(<Button>Enviar</Button>)
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeInTheDocument()
  })

  it('fica desabilitado e aria-busy quando isLoading', () => {
    render(<Button isLoading loadingLabel="Aguarde">Salvar</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Aguarde')).toBeInTheDocument()
  })

  it('não dispara onClick quando disabled', async () => {
    const user = userEvent.setup()
    const handler = vi.fn()
    render(<Button disabled onClick={handler}>Clique</Button>)
    await user.click(screen.getByRole('button'))
    expect(handler).not.toHaveBeenCalled()
  })

  it('é operável por teclado (Enter dispara click)', async () => {
    const user = userEvent.setup()
    const handler = vi.fn()
    render(<Button onClick={handler}>OK</Button>)
    screen.getByRole('button').focus()
    await user.keyboard('{Enter}')
    expect(handler).toHaveBeenCalledOnce()
  })
})
