import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { queryClient } from '@/app/queryClient'
import { onUnauthorized } from '@/api/http'
import { decodeJwtPayload } from '@/lib/jwt'
import { useLocation, useNavigate } from 'react-router'
import {
  clearSession,
  getSession,
  saveSession,
  type DadosSessao,
  type PerfilUsuario,
} from '@/lib/session'
import {
  AuthContext,
  type AuthContextValue,
  type LoginParams,
} from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [session, setSession] = useState<DadosSessao | null>(() => getSession())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const logout = useCallback(() => {
    clearTimer()
    clearSession()
    queryClient.clear()
    setSession(null)
  }, [clearTimer])

  useEffect(() =>
    onUnauthorized(() => {
      logout()
      navigate('/emissor/login', {
        replace: true,
        state: { expirou: true },
      })
    }),
  [logout, navigate])

  const login = useCallback(({ token, nome, perfil }: LoginParams) => {
    const decoded = decodeJwtPayload(token)
    const agoraSegundos = Math.floor(Date.now() / 1000)
    const exp = decoded?.exp ?? agoraSegundos + 3600
    const emissorId = decoded?.id
    const perfilNormalizado = perfil.toUpperCase() as PerfilUsuario

    const dados: DadosSessao = {
      token,
      nome,
      perfil: perfilNormalizado,
      emissorId,
      exp,
    }

    saveSession(dados)
    setSession(dados)
  }, [])

  useEffect(() => {
    if (!session) {
      clearTimer()
      return
    }

    const tempoRestanteMs = Math.max(0, session.exp * 1000 - Date.now())

    clearTimer()
    timerRef.current = setTimeout(() => {
      logout()
      if (
        location.pathname.startsWith('/emissor/') ||
        location.pathname.startsWith('/admin/')
      ) {
        navigate('/emissor/login', {
          replace: true,
          state: { expirou: true },
        })
      }
    }, tempoRestanteMs)

    return () => {
      clearTimer()
    }
  }, [session, logout, clearTimer, location.pathname, navigate])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: session !== null,
      login,
      logout,
    }),
    [session, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
