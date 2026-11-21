import { z } from 'zod'
import { getConfig } from '@/config'
import { getSession } from '@/lib/session'
import { ApiError } from './errors'

export const TIMEOUT_PADRAO_MS = 20_000

export type AuthMode = 'required' | 'none'

export interface RequestOptions<TResponse = unknown> {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'OPTIONS'
  body?: unknown
  headers?: Record<string, string>
  auth?: AuthMode
  timeoutMs?: number
  schema?: z.ZodType<TResponse>
  signal?: AbortSignal
  acceptedStatuses?: number[]
}

type UnauthorizedHandler = () => void
const unauthorizedHandlers = new Set<UnauthorizedHandler>()

/**
 * Registra um callback global para respostas não autorizadas (401 ou 403 sem mensagem).
 * NÃO importa nem depende de React.
 * Retorna uma função para remover o listener.
 */
export function onUnauthorized(handler: UnauthorizedHandler): () => void {
  unauthorizedHandlers.add(handler)
  return () => {
    unauthorizedHandlers.delete(handler)
  }
}

function notifyUnauthorized(): void {
  unauthorizedHandlers.forEach((handler) => {
    try {
      handler()
    } catch {
      // Ignora erro dentro do listener
    }
  })
}

interface BackendErrorEnvelope {
  status?: number
  mensagem?: string
}

export async function request<TResponse = unknown>(
  path: string,
  options: RequestOptions<TResponse> = {},
): Promise<TResponse> {
  const {
    method = 'GET',
    body,
    headers: customHeaders = {},
    auth = 'required',
    timeoutMs = TIMEOUT_PADRAO_MS,
    schema,
    signal: externalSignal,
    acceptedStatuses = [],
  } = options

  const config = getConfig()
  const url = `${config.apiUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`

  const headers: Record<string, string> = { ...customHeaders }

  if (auth === 'required') {
    const session = getSession()
    if (session?.token) {
      headers['Authorization'] = `Bearer ${session.token}`
    }
  }

  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData

  let requestBody: BodyInit | undefined
  if (body !== undefined && body !== null) {
    if (isFormData) {
      requestBody = body
      // NUNCA defina Content-Type manualmente para FormData (o navegador define com boundary)
      delete headers['Content-Type']
    } else if (typeof body === 'string') {
      requestBody = body
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
      }
    } else {
      requestBody = JSON.stringify(body)
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json'
      }
    }
  }

  if (!headers['Accept']) {
    headers['Accept'] = 'application/json, text/plain, */*'
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  if (externalSignal) {
    externalSignal.addEventListener('abort', () => controller.abort())
  }

  let response: Response
  try {
    response = await fetch(url, {
      method,
      headers,
      body: requestBody,
      signal: controller.signal,
    })
  } catch (error: unknown) {
    clearTimeout(timeoutId)
    if (controller.signal.aborted) {
      throw ApiError.timeout()
    }
    const msg = error instanceof Error ? error.message : String(error)
    throw ApiError.rede(msg)
  } finally {
    clearTimeout(timeoutId)
  }

  // Tratamento de respostas 4xx e 5xx
  if (!response.ok && !acceptedStatuses.includes(response.status)) {
    let mensagemBackend: string | undefined
    try {
      const errorJson = (await response.json()) as BackendErrorEnvelope
      if (errorJson && typeof errorJson.mensagem === 'string') {
        mensagemBackend = errorJson.mensagem
      }
    } catch {
      // Resposta não-JSON ou corpo vazio
    }

    // Regra AGENTS.md §8.2:
    // 401 em rota protegida -> sessão expirou
    // 403 sem mensagem no corpo -> sessão inválida
    if (auth === 'required') {
      if (response.status === 401 || (response.status === 403 && !mensagemBackend)) {
        notifyUnauthorized()
      }
    }

    throw ApiError.fromHttp(response.status, mensagemBackend)
  }

  // Tratamento de sucesso (2xx)
  let rawData: unknown
  const contentType = response.headers.get('content-type') || ''

  // Lê sempre como texto e tenta JSON. O backend pode responder texto puro rotulado como
  // application/json (ex.: Spring com Accept: application/json); response.json() falharia aí.
  try {
    const text = await response.text()
    try {
      rawData = JSON.parse(text)
    } catch {
      rawData = text
    }
  } catch {
    rawData = contentType.includes('application/json') ? null : ''
  }

  if (schema) {
    const result = schema.safeParse(rawData)
    if (!result.success) {
      const details = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ')
      throw ApiError.contrato(details)
    }
    return result.data
  }

  return rawData as TResponse
}
