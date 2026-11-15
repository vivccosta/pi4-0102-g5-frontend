import { useNavigate } from 'react-router'
import { ApiError, MENSAGEM_ERRO_GENERICA } from '@/api/errors'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CopyButton'
import { Spinner } from '@/components/ui/Spinner'
import { formatarDataEmissao } from '@/lib/datas'
import { useCertificados } from './useCertificados'
import styles from './PainelPage.module.css'

function abreviarChave(chave: string): string {
  if (chave.length <= 14) return chave
  return `${chave.slice(0, 6)}…${chave.slice(-4)}`
}

export function PainelPage() {
  const navigate = useNavigate()
  const certificadosQuery = useCertificados()
  const certificados = [...(certificadosQuery.data ?? [])].sort((a, b) =>
    b.dataEmissao.localeCompare(a.dataEmissao),
  )

  function irParaRegistro() {
    navigate('/emissor/registrar')
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
                    <span className={`${styles.badge} ${certificado.status === 'valido' ? styles.valid : styles.revoked}`}>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
