import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Button } from '@/components/ui/Button'
import { Modal } from './Modal'

function Harness({ isPending = false, onClose = vi.fn() }: { isPending?: boolean; onClose?: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>Abrir diálogo</Button>
      <Modal
        open={open}
        title="Confirmação"
        description="Confirme a ação."
        isPending={isPending}
        onClose={() => { onClose(); setOpen(false) }}
      >
        <Button type="button">Cancelar</Button>
        <Button type="button">Confirmar</Button>
      </Modal>
    </>
  )
}

describe('Modal', () => {
  it('associa título e descrição, prende Tab e restaura o foco ao fechar com Escape', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Abrir diálogo' }))
    const dialog = screen.getByRole('dialog', { name: 'Confirmação' })
    const description = screen.getByText('Confirme a ação.')
    const cancel = screen.getByRole('button', { name: 'Cancelar' })
    const confirm = screen.getByRole('button', { name: 'Confirmar' })

    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-describedby', description.id)
    expect(cancel).toHaveFocus()

    confirm.focus()
    await user.keyboard('{Tab}')
    expect(cancel).toHaveFocus()
    await user.keyboard('{Shift>}{Tab}{/Shift}')
    expect(confirm).toHaveFocus()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Abrir diálogo' })).toHaveFocus()
  })

  it('não fecha com Escape nem clique no fundo durante uma operação pendente', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<Harness isPending onClose={onClose} />)
    await user.click(screen.getByRole('button', { name: 'Abrir diálogo' }))
    const dialog = screen.getByRole('dialog', { name: 'Confirmação' })

    await user.keyboard('{Escape}')
    await user.click(dialog.parentElement!)

    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('fecha ao clicar no fundo quando não está pendente', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByRole('button', { name: 'Abrir diálogo' }))
    await user.click(screen.getByRole('dialog').parentElement!)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
