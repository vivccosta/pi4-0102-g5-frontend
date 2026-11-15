import { useState } from 'react'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { ResultadoVerificacao } from './ResultadoVerificacao'
import { useVerificarCertificado } from './useVerificarCertificado'
import styles from './VerificarPage.module.css'

export function VerificarPage() {
  const [chave, setChave] = useState('')
  const [erro, setErro] = useState('')
  const { carregando, resultado, verificar, limpar } = useVerificarCertificado()

  function enviar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const normalizada = chave.trim().replace(/[\s\r\n]+/g, '')
    if (!normalizada) {
      setErro('Informe a chave de autenticação.')
      return
    }
    setErro('')
    setChave(normalizada)
    void verificar(normalizada)
  }

  function novaConsulta() {
    limpar()
    setChave('')
    setErro('')
  }

  return <section className={styles.container}>
    <div className={styles.card}>
      <h1>Verificar certificado</h1>
      <p className={styles.intro}>Consulte o registro documental usando a chave de autenticação.</p>
      <form className={styles.form} onSubmit={enviar} noValidate>
        <Field
          label="Chave de autenticação"
          hint="Informe a chave exibida no registro do certificado. Não é necessário criar conta."
          error={erro}
          value={chave}
          onChange={(event) => { setChave(event.target.value); if (erro) setErro('') }}
          autoComplete="off"
          disabled={carregando}
        />
        <Button type="submit" isLoading={carregando} loadingLabel="Verificando certificado" disabled={carregando}>
          Verificar certificado
        </Button>
      </form>
      {resultado && <ResultadoVerificacao
        resultado={resultado}
        aoTentarNovamente={() => void verificar(chave.trim().replace(/[\s\r\n]+/g, ''))}
        aoNovaConsulta={novaConsulta}
      />}
      <Alert variant="info" className={styles.note}>
        O Timbro confirma o registro documental do certificado. Não avalia a qualidade do curso nem substitui reconhecimento oficial.
      </Alert>
    </div>
  </section>
}
