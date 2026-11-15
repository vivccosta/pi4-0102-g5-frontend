import { createContext } from 'react'
import type { DadosSessao, PerfilUsuario } from '@/lib/session'

export interface LoginParams {
  token: string
  nome: string
  perfil: PerfilUsuario | string
}

export interface AuthContextValue {
  session: DadosSessao | null
  isAuthenticated: boolean
  login: (params: LoginParams) => void
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
