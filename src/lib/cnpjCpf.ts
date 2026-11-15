import { somenteDigitosCpf, validarCpf } from './cpf'

export function formatarCnpjCpf(valor: string): string {
  const digitos = somenteDigitosCpf(valor).slice(0, 14)
  if (digitos.length <= 11) {
    if (digitos.length <= 3) return digitos
    if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`
    if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`
    return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`
  }
  return `${digitos.slice(0, 2)}.${digitos.slice(2, 5)}.${digitos.slice(5, 8)}/${digitos.slice(8, 12)}-${digitos.slice(12)}`
}

export function validarCnpjCpf(valor: string): boolean {
  const digitos = somenteDigitosCpf(valor)
  if (digitos.length === 11) return validarCpf(digitos)
  if (digitos.length !== 14 || /^([0-9])\1{13}$/.test(digitos)) return false
  const calcular = (base: string, pesos: number[]): number => {
    const soma = [...base].reduce((total, digito, indice) => total + Number(digito) * (pesos[indice] ?? 0), 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }
  const primeiro = calcular(digitos.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const segundo = calcular(digitos.slice(0, 12) + primeiro, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  return primeiro === Number(digitos[12]) && segundo === Number(digitos[13])
}
