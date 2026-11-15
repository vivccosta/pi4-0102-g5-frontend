import { HttpResponse } from 'msw'

export interface ErrorEnvelope {
  status: number
  mensagem: string
}

/**
 * Helper para criar respostas de erro no formato padrão do backend:
 * { "status": number, "mensagem": string }
 */
export function erroEnvelope(status: number, mensagem: string) {
  return HttpResponse.json<ErrorEnvelope>({ status, mensagem }, { status })
}
