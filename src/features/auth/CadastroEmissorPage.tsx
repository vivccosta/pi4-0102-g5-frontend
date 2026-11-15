import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router'
import { z } from 'zod'
import { cadastrarEmissor } from '@/api/emissores'
import { ApiError, MENSAGEM_ERRO_GENERICA } from '@/api/errors'
import { CadastrarEmissorRequestSchema } from '@/api/schemas'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { formatarCnpjCpf, validarCnpjCpf } from '@/lib/cnpjCpf'
import { somenteDigitosCpf } from '@/lib/cpf'
import styles from './LoginPage.module.css'

const CadastroFormSchema = CadastrarEmissorRequestSchema.extend({
  cnpjCpf: z.string().refine(validarCnpjCpf, 'Informe um CPF ou CNPJ válido'),
  confirmarSenha: z.string().min(1, 'Confirme a senha'),
}).superRefine((dados, contexto) => {
  if (dados.senha !== dados.confirmarSenha) {
    contexto.addIssue({ code: 'custom', path: ['confirmarSenha'], message: 'As senhas devem ser iguais' })
  }
})
type CadastroForm = z.infer<typeof CadastroFormSchema>

export function CadastroEmissorPage() {
  const [erroApi, setErroApi] = useState<string | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<CadastroForm>({
    resolver: zodResolver(CadastroFormSchema),
    defaultValues: { nome: '', email: '', cnpjCpf: '', senha: '', confirmarSenha: '' },
  })

  const onSubmit = async (dados: CadastroForm) => {
    setErroApi(null)
    try {
      const resposta = await cadastrarEmissor({
        nome: dados.nome,
        email: dados.email,
        cnpjCpf: somenteDigitosCpf(dados.cnpjCpf),
        senha: dados.senha,
      })
      setMensagemSucesso(resposta)
    } catch (erro: unknown) {
      setErroApi(erro instanceof ApiError && erro.status === 400 ? erro.mensagem : MENSAGEM_ERRO_GENERICA)
    }
  }

  if (mensagemSucesso) {
    return (
      <div className={styles.container}>
        <section className={styles.card} aria-labelledby="cadastro-sucesso-title">
          <h1 id="cadastro-sucesso-title" className={styles.title}>Solicitação enviada</h1>
          <div className={styles.alert}><Alert variant="success">{mensagemSucesso}</Alert></div>
          <p>O acesso depende da aprovação do administrador.</p>
          <p><Link to="/emissor/login">Já tenho conta</Link></p>
        </section>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <section className={styles.card} aria-labelledby="cadastro-title">
        <h1 id="cadastro-title" className={styles.title}>Solicitar cadastro de emissor</h1>
        <p className={styles.subtitle}>Preencha os dados para solicitar acesso ao Timbro.</p>
        {erroApi && <div className={styles.alert}><Alert variant="error">{erroApi}</Alert></div>}
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <Field label="Nome do emissor (empresa ou MEI)" autoComplete="organization" required error={errors.nome?.message} {...register('nome')} />
          <Field label="E-mail" type="email" autoComplete="email" required error={errors.email?.message} {...register('email')} />
          <Field
            label="CNPJ ou CPF" inputMode="numeric" autoComplete="off" required
            hint="Informe CPF ou CNPJ com dígitos verificadores."
            error={errors.cnpjCpf?.message}
            {...register('cnpjCpf', { onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
              setValue('cnpjCpf', formatarCnpjCpf(event.target.value), { shouldValidate: true })
            } })}
          />
          <Field label="Senha" type="password" autoComplete="new-password" required error={errors.senha?.message} {...register('senha')} />
          <Field label="Confirmar senha" type="password" autoComplete="new-password" required error={errors.confirmarSenha?.message} {...register('confirmarSenha')} />
          <div className={styles.actions}>
            <Button type="submit" variant="primary" size="lg" isLoading={isSubmitting} loadingLabel="Enviando solicitação…" className={styles.submitButton}>Solicitar cadastro</Button>
          </div>
        </form>
        <p className={styles.subtitle}><Link to="/emissor/login">Já tenho conta</Link></p>
      </section>
    </div>
  )
}
