import { request } from './http'
import { RegistrarCertificadoResponseSchema, type RegistrarCertificadoResponse } from './schemas'

export interface RegistroCertificadoPayload {
  nomeAluno: string
  cpfAluno: string
  curso: string
  cargaHoraria: number
  dataConclusao: string
}

export async function registrarCertificado(
  payload: RegistroCertificadoPayload,
  signal?: AbortSignal,
): Promise<RegistrarCertificadoResponse> {
  return request<RegistrarCertificadoResponse>('/api/certificados/registrar', {
    method: 'POST',
    body: payload,
    auth: 'required',
    signal,
    schema: RegistrarCertificadoResponseSchema,
  })
}
