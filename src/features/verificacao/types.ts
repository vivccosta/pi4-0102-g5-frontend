import type { ValidarCertificadoResponse } from '@/api/schemas'

export type Resultado =
  | { tipo: 'resposta'; dados: ValidarCertificadoResponse }
  | { tipo: 'indisponivel'; mensagem: string }
