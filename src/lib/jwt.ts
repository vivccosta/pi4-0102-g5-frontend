import type { PerfilUsuario } from './session'

export interface DecodedJwtPayload {
  sub: string
  perfil: PerfilUsuario
  id?: string
  iat?: number
  exp: number
}

function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) {
    base64 += '='
  }
  return decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
      .join(''),
  )
}

export function decodeJwtPayload(token: string): DecodedJwtPayload | null {
  if (typeof token !== 'string' || !token) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null

  const payloadPart = parts[1]
  if (!payloadPart) return null

  try {
    const jsonStr = base64UrlDecode(payloadPart)
    const raw = JSON.parse(jsonStr) as Record<string, unknown>

    if (typeof raw !== 'object' || raw === null) return null
    if (typeof raw.sub !== 'string' || !raw.sub) return null
    if (typeof raw.exp !== 'number' || isNaN(raw.exp)) return null

    const perfilStr = typeof raw.perfil === 'string' ? raw.perfil.toUpperCase() : ''
    if (perfilStr !== 'EMISSOR' && perfilStr !== 'ADMINISTRADOR') return null

    const emissorId =
      typeof raw.id === 'string' || typeof raw.id === 'number'
        ? String(raw.id)
        : typeof raw.emissorId === 'string'
          ? raw.emissorId
          : undefined

    return {
      sub: raw.sub,
      perfil: perfilStr as PerfilUsuario,
      id: emissorId,
      iat: typeof raw.iat === 'number' ? raw.iat : undefined,
      exp: raw.exp,
    }
  } catch {
    return null
  }
}
