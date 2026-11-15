import { useEffect, useRef } from 'react'
import type { ValidarCertificadoResponse } from '@/api/schemas'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CopyButton'
import { formatarDataConclusao } from '@/lib/datas'
import type { Resultado } from './types'
import styles from './VerificarPage.module.css'

interface Props { resultado: Resultado; aoTentarNovamente: () => void; aoNovaConsulta: () => void }

function motivo(mensagem: string) {
  return mensagem.replace(/^Certificado inválido:\s*/i, '')
}

function DadosValidos({ dados }: { dados: ValidarCertificadoResponse }) {
  return <>
    <dl className={styles.details}>
      {dados.nomeAluno && <><dt>Nome do aluno</dt><dd>{dados.nomeAluno}</dd></>}
      {dados.curso && <><dt>Curso</dt><dd>{dados.curso}</dd></>}
      {dados.dataConclusao && <><dt>Data de conclusão</dt><dd>{formatarDataConclusao(dados.dataConclusao)}</dd></>}
      {dados.hash && <><dt>Chave</dt><dd><code>{dados.hash}</code> <CopyButton value={dados.hash} /></dd></>}
    </dl>
  </>
}

export function ResultadoVerificacao({ resultado, aoTentarNovamente, aoNovaConsulta }: Props) {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => ref.current?.focus(), [resultado])
  const disponivel = resultado.tipo === 'indisponivel'
  const valido = resultado.tipo === 'resposta' && resultado.dados.valido
  const titulo = disponivel ? 'Não foi possível verificar' : valido ? 'Certificado válido' : 'Certificado inválido'
  return <section ref={ref} tabIndex={-1} role="status" aria-labelledby="resultado-titulo" className={`${styles.result} ${disponivel ? styles.unavailable : valido ? styles.valid : styles.invalid}`}>
    <h2 id="resultado-titulo">{titulo}</h2>
    {disponivel ? <><p>Serviço indisponível. Não foi possível verificar agora. Isso não significa que o certificado seja inválido.</p><Button type="button" variant="secondary" onClick={aoTentarNovamente}>Tentar novamente</Button></>
      : valido ? <DadosValidos dados={(resultado as Extract<Resultado, { tipo: 'resposta' }>).dados} />
      : <p>{motivo((resultado as Extract<Resultado, { tipo: 'resposta' }>).dados.mensagem)}</p>}
    <div className={styles.resultActions}><Button type="button" variant="ghost" onClick={aoNovaConsulta}>Nova consulta</Button></div>
  </section>
}
