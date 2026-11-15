import type { RegistroCertificadoPayload } from '@/api/certificados'
import { somenteDigitosCpf } from '@/lib/cpf'

export interface DadosRegistroCertificado {
  nomeAluno: string
  cpfAluno: string
  curso: string
  cargaHoraria: number
  dataConclusao: string
}

// TODO(contrato): Backend 1 ainda não recebe cpfAluno no DTO; manter a adaptação neste mapper.
export function toRegistroPayload(dados: DadosRegistroCertificado): RegistroCertificadoPayload {
  return {
    nomeAluno: dados.nomeAluno.trim(),
    cpfAluno: somenteDigitosCpf(dados.cpfAluno),
    curso: dados.curso.trim(),
    cargaHoraria: dados.cargaHoraria,
    dataConclusao: dados.dataConclusao,
  }
}
