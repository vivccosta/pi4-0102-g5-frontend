import { useState } from 'react'
import { copyToClipboard } from '@/lib/clipboard'
import { Button } from '../Button'

export interface CopyButtonProps { value: string }

export function CopyButton({ value }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    const success = await copyToClipboard(value)
    setCopied(success)
    if (success) window.setTimeout(() => setCopied(false), 2000)
  }
  return <span>
    <Button type="button" variant="secondary" size="sm" onClick={copy}>{copied ? 'Copiado!' : 'Copiar'}</Button>
    <span aria-live="polite" className="sr-only">{copied ? 'Copiado!' : ''}</span>
  </span>
}
