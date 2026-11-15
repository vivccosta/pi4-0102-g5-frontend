import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ativarEmissor, listarEmissoresPendentes } from '@/api/admin'

export const EMISSORES_PENDENTES_QUERY_KEY = ['emissores-pendentes']

export function useEmissoresPendentes() {
  const queryClient = useQueryClient()
  const emissoresQuery = useQuery({
    queryKey: EMISSORES_PENDENTES_QUERY_KEY,
    queryFn: ({ signal }) => listarEmissoresPendentes(signal),
    retry: false,
  })
  const ativarMutation = useMutation({
    mutationFn: (emissorId: string) => ativarEmissor(emissorId),
    retry: false,
    onSuccess: async (_resposta, emissorId) => {
      queryClient.setQueryData(
        EMISSORES_PENDENTES_QUERY_KEY,
        (emissores: Awaited<ReturnType<typeof listarEmissoresPendentes>> | undefined) =>
          emissores?.filter((emissor) => emissor.emissorId !== emissorId),
      )
      await queryClient.invalidateQueries({ queryKey: EMISSORES_PENDENTES_QUERY_KEY })
    },
  })

  return { emissoresQuery, ativarMutation }
}
