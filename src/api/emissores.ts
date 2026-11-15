import { request } from './http'
import {
  CadastrarEmissorResponseSchema,
  type CadastrarEmissorRequest,
  type CadastrarEmissorResponse,
} from './schemas'

export async function cadastrarEmissor(
  dados: CadastrarEmissorRequest,
): Promise<CadastrarEmissorResponse> {
  return request<CadastrarEmissorResponse>('/api/emissores/cadastrar', {
    method: 'POST',
    body: dados,
    auth: 'none',
    schema: CadastrarEmissorResponseSchema,
    acceptedStatuses: [201],
  })
}
