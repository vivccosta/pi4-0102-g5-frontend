import { describe, expect, it } from 'vitest'
import { formatarCpf, somenteDigitosCpf, validarCpf } from './cpf'

describe('utilitários de CPF', () => {
  it.each(['529.982.247-25', '111.444.777-35'])('aceita CPF válido %s', (cpf) => {
    expect(validarCpf(cpf)).toBe(true)
  })

  it.each(['529.982.247-24', '123', '111.111.111-11', '529982247250'])('rejeita CPF inválido %s', (cpf) => {
    expect(validarCpf(cpf)).toBe(false)
  })

  it('remove tudo que não for dígito', () => {
    expect(somenteDigitosCpf('529.982.247-25xyz')).toBe('52998224725')
  })

  it('aplica máscara progressiva ao digitar', () => {
    expect(formatarCpf('529')).toBe('529')
    expect(formatarCpf('529982')).toBe('529.982')
    expect(formatarCpf('529982247')).toBe('529.982.247')
    expect(formatarCpf('52998224725')).toBe('529.982.247-25')
  })
})
