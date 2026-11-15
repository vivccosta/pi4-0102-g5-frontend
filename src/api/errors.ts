export type ApiErrorKind = 'http' | 'rede' | 'timeout' | 'contrato'

export const MENSAGEM_ERRO_GENERICA =
  'Não foi possível concluir a operação agora. Tente novamente em instantes.'

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly mensagem: string

  constructor(kind: ApiErrorKind, mensagem: string, status?: number) {
    super(mensagem)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.mensagem = mensagem
  }

  static fromHttp(status: number, mensagemBackend?: string): ApiError {
    // 400, 401, 403, 404: mensagem do backend é legível ao usuário em pt-BR
    if (status >= 400 && status < 500 && mensagemBackend) {
      return new ApiError('http', mensagemBackend, status)
    }
    // 5xx ou erro sem mensagem amigável: mensagem genérica fixa
    return new ApiError('http', MENSAGEM_ERRO_GENERICA, status)
  }

  static rede(mensagemOriginal?: string): ApiError {
    if (import.meta.env?.DEV && mensagemOriginal) {
      console.error('[Timbro] Erro de rede:', mensagemOriginal)
    }
    return new ApiError('rede', MENSAGEM_ERRO_GENERICA)
  }

  static timeout(): ApiError {
    return new ApiError('timeout', MENSAGEM_ERRO_GENERICA)
  }

  static contrato(detalhes?: string): ApiError {
    if (import.meta.env?.DEV && detalhes) {
      console.error('[Timbro] Contrato inválido:', detalhes)
    }
    return new ContratoInvalidoError(detalhes)
  }
}

export class ContratoInvalidoError extends ApiError {
  readonly detalhes?: string

  constructor(detalhes?: string) {
    super('contrato', MENSAGEM_ERRO_GENERICA)
    this.name = 'ContratoInvalidoError'
    this.detalhes = detalhes
  }
}
