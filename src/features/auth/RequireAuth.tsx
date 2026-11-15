import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import type { PerfilUsuario } from '@/lib/session'
import { useAuth } from './useAuth'

interface RequireAuthProps {
  perfis: PerfilUsuario[]
  children: ReactNode
}

export function RequireAuth({ perfis, children }: RequireAuthProps) {
  const { session } = useAuth()
  const location = useLocation()

  if (!session) {
    return (
      <Navigate
        to="/emissor/login"
        replace
        state={{ from: location, expirou: Boolean(location.state?.expirou) }}
      />
    )
  }

  if (!perfis.includes(session.perfil)) {
    const destino = session.perfil === 'ADMINISTRADOR' ? '/admin/emissores' : '/emissor/painel'
    return <Navigate to={destino} replace />
  }

  return <>{children}</>
}
