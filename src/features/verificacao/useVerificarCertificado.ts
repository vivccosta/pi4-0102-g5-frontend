import { useEffect, useRef, useState } from 'react'
import { validarCertificado } from '@/api/verificacao'
import { ApiError, MENSAGEM_ERRO_GENERICA } from '@/api/errors'
import type { Resultado } from './types'

export function useVerificarCertificado() {
  const [carregando, setCarregando] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const controller = useRef<AbortController | null>(null)
  const executando = useRef(false)

  useEffect(() => () => controller.current?.abort(), [])

  async function verificar(chave: string) {
    if (executando.current) return
    controller.current?.abort()
    const atual = new AbortController()
    controller.current = atual
    executando.current = true
    setCarregando(true)
    setResultado(null)
    try {
      const dados = await validarCertificado(chave, atual.signal)
      if (!atual.signal.aborted) setResultado({ tipo: 'resposta', dados })
    } catch (error: unknown) {
      if (atual.signal.aborted) return
      setResultado({ tipo: 'indisponivel', mensagem: error instanceof ApiError ? error.mensagem : MENSAGEM_ERRO_GENERICA })
    } finally {
      if (controller.current === atual) {
        executando.current = false
        setCarregando(false)
      }
    }
  }

  function limpar() {
    controller.current?.abort()
    controller.current = null
    executando.current = false
    setCarregando(false)
    setResultado(null)
  }

  return { carregando, resultado, verificar, limpar }
}
