import { request } from './http'
import { ValidarCertificadoResponseSchema, type ValidarCertificadoResponse } from './schemas'

export async function validarCertificado(chave: string, signal?: AbortSignal): Promise<ValidarCertificadoResponse> {
  const body = new FormData()
  body.set('tipoValidacao', 'CHAVE')
  body.set('chaveAutenticacao', chave)

  return request<ValidarCertificadoResponse>('/api/certificados/validar', {
    method: 'POST',
    body,
    auth: 'none',
    signal,
    acceptedStatuses: [404],
    schema: ValidarCertificadoResponseSchema,
  })
}
