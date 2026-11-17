import { useState } from 'react'
import { ApiError, MENSAGEM_ERRO_GENERICA } from '@/api/errors'
import type { EmissorPendente } from '@/api/schemas'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useEmissoresPendentes } from './useEmissoresPendentes'
import styles from './AdminEmissoresPage.module.css'

function formatarDocumento(documento: string): string {
  const digitos = documento.replace(/\D/g, '')
  if (digitos.length === 11) return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  if (digitos.length === 14) return digitos.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  return documento
}

function Documentacao({ emissor }: { emissor: EmissorPendente }) {
  const itens = emissor.documentacao === undefined
    ? []
    : Array.isArray(emissor.documentacao) ? emissor.documentacao : [emissor.documentacao]

  return (
    <section className={styles.documentation} aria-label={`Documentação de ${emissor.nome}`}>
      <h3>Documentação</h3>
      {itens.length === 0 ? (
        // TODO(contrato): o backend ainda não envia documentacao no DTO de emissores pendentes.
        <p className={styles.muted}>Documentação não disponível na API ainda.</p>
      ) : (
        <ul>
          {itens.map((item, index) => (
            <li key={`${index}-${item}`}>
              {item.startsWith('http://') || item.startsWith('https://') ? (
                <a href={item} target="_blank" rel="noopener noreferrer">{item}</a>
              ) : item}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export function AdminEmissoresPage() {
  const { emissoresQuery, ativarMutation } = useEmissoresPendentes()
  const [itensCarregando, setItensCarregando] = useState<string[]>([])
  const [errosPorEmissor, setErrosPorEmissor] = useState<Record<string, string>>({})
  const [sucesso, setSucesso] = useState('')

  async function aprovar(emissor: EmissorPendente) {
    setItensCarregando((itens) => [...itens, emissor.emissorId])
    setErrosPorEmissor((erros) => ({ ...erros, [emissor.emissorId]: '' }))
    setSucesso('')
    try {
      await ativarMutation.mutateAsync(emissor.emissorId)
      setSucesso('Emissor ativado com sucesso')
    } catch (error) {
      setErrosPorEmissor((erros) => ({
        ...erros,
        [emissor.emissorId]: error instanceof ApiError ? error.mensagem : MENSAGEM_ERRO_GENERICA,
      }))
    } finally {
      setItensCarregando((itens) => itens.filter((id) => id !== emissor.emissorId))
    }
  }

  return (
    <section className={styles.page}>
      <h1>Emissores pendentes</h1>
      {sucesso && <Alert variant="success">{sucesso}</Alert>}

      {emissoresQuery.isPending && (
        <div className={styles.feedback}><Spinner label="Carregando emissores pendentes" /><span>Carregando emissores pendentes…</span></div>
      )}
      {emissoresQuery.isError && (
        <div className={styles.feedback}>
          <Alert variant="error">{emissoresQuery.error instanceof ApiError ? emissoresQuery.error.mensagem : MENSAGEM_ERRO_GENERICA}</Alert>
          <Button type="button" variant="secondary" isLoading={emissoresQuery.isFetching} loadingLabel="Carregando emissores pendentes" onClick={() => void emissoresQuery.refetch()}>Tentar novamente</Button>
        </div>
      )}
      {emissoresQuery.isSuccess && emissoresQuery.data.length === 0 && <p>Nenhum emissor pendente.</p>}
      {emissoresQuery.isSuccess && emissoresQuery.data.length > 0 && (
        <div className={styles.list}>
          {emissoresQuery.data.map((emissor) => {
            const carregando = itensCarregando.includes(emissor.emissorId)
            const erro = errosPorEmissor[emissor.emissorId]
            return (
              <article className={styles.card} key={emissor.emissorId}>
                <div className={styles.details}>
                  <h2>{emissor.nome}</h2>
                  <dl>
                    <div><dt>E-mail</dt><dd>{emissor.email}</dd></div>
                    <div><dt>CNPJ</dt><dd>{formatarDocumento(emissor.cnpj ?? emissor.cnpjCpf ?? '')}</dd></div>
                    <div><dt>Situação</dt><dd>Pendente</dd></div>
                  </dl>
                  <Documentacao emissor={emissor} />
                </div>
                <div className={styles.actions}>
                  {erro && <Alert variant="error">{erro}</Alert>}
                  <Button type="button" isLoading={carregando} loadingLabel={`Aprovando ${emissor.nome}`} onClick={() => void aprovar(emissor)}>Aprovar</Button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
