/**
 * Formata data de conclusão (YYYY-MM-DD) para dd/MM/yyyy.
 * NUNCA utiliza new Date(string) para evitar conversões e deslocamento de fuso UTC.
 */
export function formatarDataConclusao(dataStr: string): string {
  if (!dataStr || typeof dataStr !== 'string') return ''

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dataStr.trim())
  if (!match) return dataStr

  const [, ano, mes, dia] = match
  return `${dia}/${mes}/${ano}`
}

/**
 * Formata data de emissão (LocalDateTime ISO sem fuso, ex: 2026-10-14T09:30:00 ou com frações .123456)
 * para dd/MM/yyyy HH:mm.
 * Realiza parse manual via regex, aceitando frações de segundo, sem new Date(string).
 */
export function formatarDataEmissao(dataStr: string): string {
  if (!dataStr || typeof dataStr !== 'string') return ''

  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?$/.exec(
    dataStr.trim(),
  )
  if (!match) return dataStr

  const [, ano, mes, dia, hora, minuto] = match
  return `${dia}/${mes}/${ano} ${hora}:${minuto}`
}
