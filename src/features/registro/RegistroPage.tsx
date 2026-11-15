import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { z } from 'zod'
import { ApiError, MENSAGEM_ERRO_GENERICA } from '@/api/errors'
import { registrarCertificado, type RegistroCertificadoPayload } from '@/api/certificados'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { CopyButton } from '@/components/ui/CopyButton'
import { Field } from '@/components/ui/Field'
import { useAuth } from '@/features/auth/useAuth'
import { formatarCpf, validarCpf } from '@/lib/cpf'
import { toRegistroPayload } from './registroMapper'
import styles from './RegistroPage.module.css'

const dataValida = (data: string): boolean => {
  const partes = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data)
  if (!partes) return false
  const ano = Number(partes[1])
  const mes = Number(partes[2])
  const dia = Number(partes[3])
  const dataParseada = new Date(ano, mes - 1, dia)
  return dataParseada.getFullYear() === ano && dataParseada.getMonth() === mes - 1 && dataParseada.getDate() === dia
}

const RegistroFormSchema = z.object({
  nomeAluno: z.string().trim().min(1, 'Informe o nome completo do aluno.').refine(
    (nome) => nome.split(/\s+/).filter(Boolean).length >= 2,
    'Informe o nome e o sobrenome do aluno.',
  ),
  cpfAluno: z.string().refine((cpf) => cpf.trim().length > 0, 'Informe o CPF do aluno.').refine(
    validarCpf,
    'Informe um CPF válido.',
  ),
  curso: z.string().trim().min(1, 'Informe o curso.'),
  cargaHoraria: z.string()
    .trim()
    .min(1, 'Informe a carga horária.')
    .regex(/^\d+$/, 'Informe um número inteiro de horas.')
    .transform(Number)
    .pipe(z.number().int('Informe um número inteiro de horas.').positive('A carga horária deve ser maior que zero.')),
  dataConclusao: z.string().min(1, 'Informe a data de conclusão.').refine(
    dataValida,
    'Informe uma data válida.',
  ),
})

type RegistroFormInput = z.input<typeof RegistroFormSchema>
type RegistroFormData = z.output<typeof RegistroFormSchema>

export function RegistroPage() {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const [hash, setHash] = useState<string | null>(null)
  const mutation = useMutation({
    mutationFn: (payload: RegistroCertificadoPayload) => registrarCertificado(payload),
    retry: false,
    onSuccess: (resposta) => {
      setHash(resposta.hash.trim().replace(/[\s\r\n]+/g, ''))
      void queryClient.invalidateQueries({ queryKey: ['certificados', session?.emissorId] })
    },
  })
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RegistroFormInput, unknown, RegistroFormData>({
    resolver: zodResolver(RegistroFormSchema),
    defaultValues: { nomeAluno: '', cpfAluno: '', curso: '', cargaHoraria: '', dataConclusao: '' },
  })

  async function enviar(dados: RegistroFormData) {
    try {
      await mutation.mutateAsync(toRegistroPayload(dados))
    } catch {
      // A mensagem segura é apresentada abaixo; os valores do formulário permanecem no RHF.
    }
  }

  function registrarOutro() {
    reset()
    mutation.reset()
    setHash(null)
  }

  if (hash) {
    return (
      <section className={styles.page}>
        <h1>Registro de certificado</h1>
        <Alert variant="success">
          <p>Registro realizado com sucesso! Hash: {hash}</p>
          <p>A chave também fica disponível no painel de certificados.</p>
        </Alert>
        <div className={styles.hash} aria-label={`Chave completa: ${hash}`}>{hash}</div>
        <div className={styles.actions}>
          <CopyButton value={hash} />
          <Button type="button" variant="secondary" onClick={registrarOutro}>Registrar outro certificado</Button>
          <Link className={styles.link} to="/emissor/painel">Ver meus certificados</Link>
        </div>
      </section>
    )
  }

  const mensagemErro = mutation.error instanceof ApiError
    ? ([400, 401, 403].includes(mutation.error.status ?? 0) ? mutation.error.mensagem : MENSAGEM_ERRO_GENERICA)
    : mutation.error ? MENSAGEM_ERRO_GENERICA : null
  const ocupado = mutation.isPending || isSubmitting

  return (
    <section className={styles.page}>
      <h1>Registro de certificado</h1>
      <p>Preencha os dados do aluno para registrar o certificado.</p>
      {mensagemErro && <Alert variant="error">{mensagemErro}</Alert>}
      <form className={styles.form} onSubmit={handleSubmit(enviar)} noValidate>
        <Field label="Nome completo do aluno" required autoComplete="name" {...register('nomeAluno')} error={errors.nomeAluno?.message} />
        <Field
          label="CPF do aluno"
          required
          inputMode="numeric"
          autoComplete="off"
          maxLength={14}
          {...register('cpfAluno', {
            onChange: (event) => setValue('cpfAluno', formatarCpf(event.currentTarget.value), { shouldValidate: true }),
          })}
          error={errors.cpfAluno?.message}
        />
        <Field label="Curso" required autoComplete="off" {...register('curso')} error={errors.curso?.message} />
        <Field label="Carga horária (horas)" required type="number" min="1" step="1" inputMode="numeric" {...register('cargaHoraria')} error={errors.cargaHoraria?.message} />
        <Field label="Data de conclusão" required type="date" {...register('dataConclusao')} error={errors.dataConclusao?.message} />
        <Button type="submit" isLoading={ocupado} loadingLabel="Registrando certificado">Registrar e gerar código</Button>
      </form>
    </section>
  )
}
