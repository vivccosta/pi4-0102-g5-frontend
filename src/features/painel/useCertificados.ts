import { useQuery } from '@tanstack/react-query'
import { listarCertificados } from '@/api/certificados'
import { useAuth } from '@/features/auth/useAuth'

export function useCertificados() {
  const { session } = useAuth()
  const emissorId = session?.emissorId

  return useQuery({
    queryKey: ['certificados', emissorId],
    queryFn: ({ signal }) => {
      if (!emissorId) throw new Error('Emissor não identificado na sessão.')
      return listarCertificados(emissorId, signal)
    },
    enabled: Boolean(session?.token && emissorId),
  })
}
