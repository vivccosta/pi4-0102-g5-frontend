import { describe, expect, it } from 'vitest'
import { formatarCnpjCpf, validarCnpjCpf } from './cnpjCpf'

describe('cnpjCpf', () => {
  it('valida e mascara CPF e CNPJ por dígitos verificadores', () => {
    expect(validarCnpjCpf('529.982.247-25')).toBe(true)
    expect(formatarCnpjCpf('52998224725')).toBe('529.982.247-25')
    expect(validarCnpjCpf('11.222.333/0001-81')).toBe(true)
    expect(formatarCnpjCpf('11222333000181')).toBe('11.222.333/0001-81')
  })

  it('rejeita comprimentos e dígitos verificadores inválidos', () => {
    expect(validarCnpjCpf('123')).toBe(false)
    expect(validarCnpjCpf('11111111111')).toBe(false)
    expect(validarCnpjCpf('11222333000180')).toBe(false)
  })
})
