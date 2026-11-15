import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { copyToClipboard } from './clipboard'

describe('copyToClipboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('retorna false para texto vazio', async () => {
    const result = await copyToClipboard('')
    expect(result).toBe(false)
  })

  it('usa navigator.clipboard quando disponível e bem-sucedido', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    })

    const result = await copyToClipboard('chave-teste-123')
    expect(result).toBe(true)
    expect(writeTextMock).toHaveBeenCalledWith('chave-teste-123')
  })

  it('usa fallback document.execCommand se clipboard falhar', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Permissão negada')),
      },
    })

    const execCommandMock = vi.fn().mockReturnValue(true)
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      writable: true,
      configurable: true,
    })

    const result = await copyToClipboard('chave-teste-123')
    expect(result).toBe(true)
    expect(execCommandMock).toHaveBeenCalledWith('copy')
  })
})
