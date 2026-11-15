import { request } from './http'
import {
  ListarCertificadosResponseSchema,
  RegistrarCertificadoResponseSchema,
  type RegistrarCertificadoResponse,
  type CertificadoResumo,
  RevogarCertificadoResponseSchema,
  type RevogarCertificadoResponse,
} from './schemas'

export async function listarCertificados(
  emissorId: string,
  signal?: AbortSignal,
): Promise<CertificadoResumo[]> {
  return request<CertificadoResumo[]>(`/api/emissores/${encodeURIComponent(emissorId)}/certificados`, {
    method: 'GET',
    auth: 'required',
    signal,
    schema: ListarCertificadosResponseSchema,
  })
}

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

export async function revogarCertificado(
  certificadoId: number,
  signal?: AbortSignal,
): Promise<RevogarCertificadoResponse> {
  return request<RevogarCertificadoResponse>(
    `/api/certificados/${encodeURIComponent(certificadoId)}/revogar`,
    {
      method: 'POST',
      auth: 'required',
      signal,
      schema: RevogarCertificadoResponseSchema,
    },
  )
}
