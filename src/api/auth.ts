import { request } from './http'
import {
  LoginResponseSchema,
  type LoginRequest,
  type LoginResponse,
} from './schemas'

/**
 * Autentica o emissor ou administrador no Backend 1 (CT1/CT3).
 * Rota pública: auth: 'none'.
 * Retorna token, nome e perfil ('EMISSOR' | 'ADMINISTRADOR').
 */
export async function autenticarEmissor(
  credenciais: LoginRequest,
): Promise<LoginResponse> {
  return request<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: credenciais,
    auth: 'none',
    schema: LoginResponseSchema,
  })
}
