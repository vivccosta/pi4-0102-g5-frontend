import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CopyButton } from './CopyButton'
import { copyToClipboard } from '@/lib/clipboard'

vi.mock('@/lib/clipboard', () => ({ copyToClipboard: vi.fn().mockResolvedValue(true) }))

describe('CopyButton', () => {
  it('copia o valor e anuncia o sucesso', async () => {
    vi.mocked(copyToClipboard).mockResolvedValue(true)
    const user = userEvent.setup()
    render(<CopyButton value="chave-completa" />)
    await user.click(screen.getByRole('button', { name: 'Copiar' }))
    expect(copyToClipboard).toHaveBeenCalledWith('chave-completa')
    expect(await screen.findByRole('button', { name: 'Copiado!' })).toBeInTheDocument()
    expect(screen.getByText('Copiado!', { selector: '[aria-live]' })).toBeInTheDocument()
  })
})
