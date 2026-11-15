import { z } from 'zod'

export const configSchema = z.object({
  apiUrl: z.string().url('apiUrl deve ser uma URL válida'),
  wsUrl: z.string().optional(),
})

export type TimbroConfig = z.infer<typeof configSchema>

declare global {
  interface Window {
    __TIMBRO_CONFIG__?: unknown
  }
}

export function getConfig(): TimbroConfig {
  const raw = typeof window !== 'undefined' ? window.__TIMBRO_CONFIG__ : undefined
  const result = configSchema.safeParse(raw)

  if (!result.success) {
    const errorDetails = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join(', ')
    throw new Error(
      `Configuração do Timbro inválida ou ausente em window.__TIMBRO_CONFIG__: ${errorDetails}`,
    )
  }

  return result.data
}
