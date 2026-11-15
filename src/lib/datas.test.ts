import { describe, expect, it } from 'vitest'
import { formatarDataConclusao, formatarDataEmissao } from './datas'

describe('formatarDataConclusao', () => {
  it('converte YYYY-MM-DD para dd/MM/yyyy sem deslocamento de fuso', () => {
    expect(formatarDataConclusao('2026-10-14')).toBe('14/10/2026')
    expect(formatarDataConclusao('2025-01-01')).toBe('01/01/2025')
    expect(formatarDataConclusao('2024-12-31')).toBe('31/12/2024')
  })

  it('retorna string original se formato for inválido', () => {
    expect(formatarDataConclusao('14/10/2026')).toBe('14/10/2026')
    expect(formatarDataConclusao('')).toBe('')
  })
})

describe('formatarDataEmissao', () => {
  it('converte LocalDateTime ISO para dd/MM/yyyy HH:mm', () => {
    expect(formatarDataEmissao('2026-10-14T09:30:00')).toBe('14/10/2026 09:30')
  })

  it('aceita LocalDateTime com frações de segundo (.123 ou .123456)', () => {
    expect(formatarDataEmissao('2026-10-14T09:30:00.123')).toBe('14/10/2026 09:30')
    expect(formatarDataEmissao('2026-10-14T14:45:10.987654')).toBe('14/10/2026 14:45')
  })

  it('aceita LocalDateTime sem segundos explícitos', () => {
    expect(formatarDataEmissao('2026-10-14T09:30')).toBe('14/10/2026 09:30')
  })

  it('retorna string original ou vazia se formato for inválido', () => {
    expect(formatarDataEmissao('data-invalida')).toBe('data-invalida')
    expect(formatarDataEmissao('')).toBe('')
  })
})
