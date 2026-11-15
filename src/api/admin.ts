import { request } from './http'
import {
  AtivarEmissorResponseSchema,
  ListarEmissoresPendentesResponseSchema,
  type EmissorPendente,
} from './schemas'

export function listarEmissoresPendentes(signal?: AbortSignal): Promise<EmissorPendente[]> {
  return request('/api/admin/emissores/pendentes', {
    method: 'GET', auth: 'required', signal, schema: ListarEmissoresPendentesResponseSchema,
  })
}

export function ativarEmissor(emissorId: string, signal?: AbortSignal): Promise<string> {
  // TODO(contrato): CT17 prevê PATCH/status e JSON; o Backend 1 usa PUT/novoStatus e texto puro.
  return request(`/api/admin/emissores/${encodeURIComponent(emissorId)}/status`, {
    method: 'PUT', body: { novoStatus: 'ATIVO' }, auth: 'required', signal,
    schema: AtivarEmissorResponseSchema,
  })
}
