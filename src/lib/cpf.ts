const SOMENTE_DIGITOS = /\D/g

export function somenteDigitosCpf(cpf: string): string {
  return cpf.replace(SOMENTE_DIGITOS, '')
}

export function formatarCpf(cpf: string): string {
  const digitos = somenteDigitosCpf(cpf).slice(0, 11)
  if (digitos.length <= 3) return digitos
  if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`
  if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`
}

export function validarCpf(cpf: string): boolean {
  const digitos = somenteDigitosCpf(cpf)
  if (digitos.length !== 11 || /^([0-9])\1{10}$/.test(digitos)) return false

  const calcularDigito = (base: string, pesoInicial: number): number => {
    let soma = 0
    for (let indice = 0; indice < base.length; indice += 1) {
      soma += Number(base[indice]) * (pesoInicial - indice)
    }
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }

  const primeiro = calcularDigito(digitos.slice(0, 9), 10)
  if (primeiro !== Number(digitos[9])) return false
  return calcularDigito(digitos.slice(0, 10), 11) === Number(digitos[10])
}
