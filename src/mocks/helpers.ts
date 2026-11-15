import { HttpResponse } from 'msw'

export interface ErrorEnvelope {
  status: number
  mensagem: string
}

/**
 * Helper para criar respostas de erro no formato padrão do backend:
 * { "status": number, "mensagem": string }
 */
export function erroEnvelope(status: number, mensagem: string) {
  return HttpResponse.json<ErrorEnvelope>({ status, mensagem }, { status })
}

/**
 * Codifica uma string em base64url com suporte completo a caracteres UTF-8.
 */
export function base64UrlEncode(str: string): string {
  const utf8Bytes = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
    String.fromCharCode(parseInt(p1, 16)),
  )
  return btoa(utf8Bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

export interface MockJwtClaims {
  sub: string
  id?: string
  perfil: 'EMISSOR' | 'ADMINISTRADOR'
  nome: string
  iat?: number
  exp?: number
}

/**
 * Gera dinamicamente um JWT fictício válido para uso nos handlers do MSW.
 * Claims: sub, id, perfil, nome, iat, exp (em segundos, padrão agora + 1h).
 * Payload codificado em base64url com suporte a UTF-8.
 */
export function gerarMockJwt(claims: MockJwtClaims): string {
  const header = { alg: 'HS256', typ: 'JWT' }
  const agoraSegundos = Math.floor(Date.now() / 1000)

  const payload = {
    sub: claims.sub,
    id: claims.id ?? 'mock-uuid-1',
    perfil: claims.perfil,
    nome: claims.nome,
    iat: claims.iat ?? agoraSegundos,
    exp: claims.exp ?? agoraSegundos + 3600,
  }

  const headerEncoded = base64UrlEncode(JSON.stringify(header))
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload))
  const mockSignature = 'mock-signature-hash'

  return `${headerEncoded}.${payloadEncoded}.${mockSignature}`
}
