import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { ApiError, MENSAGEM_ERRO_GENERICA } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CopyButton'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { formatarDataEmissao } from '@/lib/datas'
import { useCertificados } from './useCertificados'
import { useRevogarCertificado } from './useRevogarCertificado'
import styles from './PainelPage.module.css'

function abreviarChave(chave: string): string {
  if (chave.length <= 14) return chave
  return `${chave.slice(0, 6)}…${chave.slice(-4)}`
}

export function PainelPage() {
  const navigate = useNavigate()
  const certificadosQuery = useCertificados()
  const revogarMutation = useRevogarCertificado()
  const [certificadoSelecionado, setCertificadoSelecionado] = useState<{ id: string; nomeAluno: string } | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState('')
  const [erroRevogacao, setErroRevogacao] = useState('')
  const confirmacaoEmAndamento = useRef(false)
  const certificados = [...(certificadosQuery.data ?? [])].sort((a, b) =>
    b.dataEmissao.localeCompare(a.dataEmissao),
  )

  function irParaRegistro() {
    navigate('/emissor/registrar')
  }

  function abrirConfirmacao(certificadoId: string, nomeAluno: string) {
    setErroRevogacao('')
    setMensagemSucesso('')
    setCertificadoSelecionado({ id: certificadoId, nomeAluno })
  }

  async function confirmarRevogacao() {
    if (!certificadoSelecionado || confirmacaoEmAndamento.current) return

    confirmacaoEmAndamento.current = true
    setErroRevogacao('')
    try {
      await revogarMutation.mutateAsync(Number(certificadoSelecionado.id))
      setCertificadoSelecionado(null)
      setMensagemSucesso('Certificado revogado com sucesso.')
    } catch (error) {
      setErroRevogacao(error instanceof ApiError ? error.mensagem : MENSAGEM_ERRO_GENERICA)
    } finally {
      confirmacaoEmAndamento.current = false
    }
  }

  return (
    <section className={styles.page}>
      <div className={styles.heading}>
        <div>
          <h1>Meus certificados</h1>
          <p>Consulte os certificados registrados pela sua instituição.</p>
        </div>
        <Button type="button" onClick={irParaRegistro}>Registrar certificado</Button>
      </div>

      {mensagemSucesso && <Alert variant="success">{mensagemSucesso}</Alert>}

      {certificadosQuery.isPending && (
        <div className={styles.loading}>
          <Spinner label="Carregando certificados" />
          <span>Carregando certificados…</span>
        </div>
      )}

      {certificadosQuery.isError && (
        <div className={styles.feedback}>
          <Alert variant="error">
            {certificadosQuery.error instanceof ApiError
              ? certificadosQuery.error.mensagem
              : MENSAGEM_ERRO_GENERICA}
          </Alert>
          <Button
            type="button"
            variant="secondary"
            isLoading={certificadosQuery.isFetching}
            loadingLabel="Carregando certificados"
            onClick={() => void certificadosQuery.refetch()}
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {certificadosQuery.isSuccess && certificados.length === 0 && (
        <div className={styles.empty}>
          <p>Você ainda não registrou nenhum certificado.</p>
          <Button type="button" onClick={irParaRegistro}>Registrar certificado</Button>
        </div>
      )}

      {certificadosQuery.isSuccess && certificados.length > 0 && (
        <div className={styles.tableContainer} role="region" aria-label="Tabela de certificados" tabIndex={0}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">Aluno</th>
                <th scope="col">Curso</th>
                <th scope="col">Data de emissão</th>
                <th scope="col">Situação</th>
                <th scope="col">Chave</th>
                <th scope="col">Ações</th>
              </tr>
            </thead>
            <tbody>
              {certificados.map((certificado) => (
                <tr key={certificado.certificadoId}>
                  <td>{certificado.nomeAluno}</td>
                  {/* TODO(contrato): curso ainda não é devolvido pelo DTO do Backend 1. */}
                  <td>{certificado.curso ?? '—'}</td>
                  <td>{formatarDataEmissao(certificado.dataEmissao)}</td>
                  <td>
                    <span
                      className={`${styles.badge} ${certificado.status === 'valido' ? styles.valid : styles.revoked}`}
                    >
                      {certificado.status === 'valido' ? 'Válido' : 'Revogado'}
                    </span>
                  </td>
                  <td>
                    <div className={styles.key}>
                      <span title={certificado.hash} aria-label={`Chave completa: ${certificado.hash}`}>
                        {abreviarChave(certificado.hash)}
                      </span>
                      <CopyButton value={certificado.hash} />
                    </div>
                  </td>
                  <td>
                    {certificado.status === 'valido' && (
                      <Button
                        type="button"
                        variant="secondary"
                        className={styles.revokeButton}
                        onClick={() => abrirConfirmacao(certificado.certificadoId, certificado.nomeAluno)}
                      >
                        Revogar
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={certificadoSelecionado !== null}
        title="Revogar certificado?"
        description={certificadoSelecionado
          ? `Você está revogando o certificado de ${certificadoSelecionado.nomeAluno}. Depois disso ele passará a ser exibido como inválido em todas as consultas. Esta ação não pode ser desfeita.`
          : ''}
        onClose={() => {
          if (!revogarMutation.isPending) setCertificadoSelecionado(null)
        }}
        isPending={revogarMutation.isPending}
      >
        {erroRevogacao && <Alert variant="error">{erroRevogacao}</Alert>}
        <div className={styles.modalActions}>
          <Button
            type="button"
            variant="secondary"
            disabled={revogarMutation.isPending}
            onClick={() => setCertificadoSelecionado(null)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className={styles.revokeButton}
            isLoading={revogarMutation.isPending}
            loadingLabel="Revogando certificado"
            onClick={() => void confirmarRevogacao()}
          >
            {revogarMutation.isPending ? 'Revogando…' : 'Revogar certificado'}
          </Button>
        </div>
      </Modal>
    </section>
  )
}
