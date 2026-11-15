import { useMutation, useQueryClient } from '@tanstack/react-query'
import { revogarCertificado } from '@/api/certificados'
import { ApiError } from '@/api/errors'
import { useAuth } from '@/features/auth/useAuth'

const MENSAGEM_JA_REVOGADO = 'Este certificado já se encontra revogado.'

export function useRevogarCertificado() {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const emissorId = session?.emissorId
  const queryKey = ['certificados', emissorId]

  return useMutation({
    mutationFn: (certificadoId: number) => revogarCertificado(certificadoId),
    retry: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey })
    },
    onError: async (error) => {
      if (error instanceof ApiError && error.status === 400 && error.mensagem === MENSAGEM_JA_REVOGADO) {
        await queryClient.invalidateQueries({ queryKey })
      }
    },
  })
}
