export type PerfilUsuario = 'EMISSOR' | 'ADMINISTRADOR'

export interface DadosSessao {
  token: string
  nome: string
  perfil: PerfilUsuario
  emissorId?: string
  exp: number
}

const CHAVE_SESSAO = 'timbro.sessao'

export function saveSession(dados: DadosSessao): void {
  try {
    sessionStorage.setItem(
      CHAVE_SESSAO,
      JSON.stringify({
        ...dados,
        perfil: dados.perfil.toUpperCase() as PerfilUsuario,
      }),
    )
  } catch {
    // sessionStorage indisponível
  }
}

export function getSession(): DadosSessao | null {
  try {
    const raw = sessionStorage.getItem(CHAVE_SESSAO)
    if (!raw) return null

    const parsed = JSON.parse(raw) as Partial<DadosSessao>
    if (!parsed || typeof parsed.token !== 'string' || !parsed.token) {
      clearSession()
      return null
    }

    if (typeof parsed.exp !== 'number' || parsed.exp * 1000 <= Date.now()) {
      clearSession()
      return null
    }

    const perfil = typeof parsed.perfil === 'string' ? parsed.perfil.toUpperCase() : ''
    if (perfil !== 'EMISSOR' && perfil !== 'ADMINISTRADOR') {
      clearSession()
      return null
    }

    return {
      token: parsed.token,
      nome: typeof parsed.nome === 'string' ? parsed.nome : '',
      perfil,
      emissorId: typeof parsed.emissorId === 'string' ? parsed.emissorId : undefined,
      exp: parsed.exp,
    }
  } catch {
    clearSession()
    return null
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(CHAVE_SESSAO)
  } catch {
    // ignorar
  }
}

export function hasSession(): boolean {
  return getSession() !== null
}
