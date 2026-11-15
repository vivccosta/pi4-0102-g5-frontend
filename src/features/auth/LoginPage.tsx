import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { autenticarEmissor } from '@/api/auth'
import { ApiError, MENSAGEM_ERRO_GENERICA } from '@/api/errors'
import { LoginRequestSchema, type LoginRequest } from '@/api/schemas'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { useAuth } from './useAuth'
import { obterDestinoAposLogin } from './destinos'
import styles from './LoginPage.module.css'

const MSG_PADRAO_401 =
  'Acesso não autorizado. Apenas emissores cadastrados podem acessar esta área.'
const MSG_SESSAO_EXPIRADA = 'Sua sessão expirou. Entre novamente.'

export function LoginPage() {
  const { session, isAuthenticated, login } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [erroApi, setErroApi] = useState<string | null>(null)

  const locationState = location.state as
    | { from?: string | { pathname: string }; expirou?: boolean }
    | undefined

  const fromPath =
    typeof locationState?.from === 'string'
      ? locationState.from
      : locationState?.from?.pathname

  const sessaoExpirou = Boolean(locationState?.expirou)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginRequest>({
    resolver: zodResolver(LoginRequestSchema),
    defaultValues: {
      email: '',
      senha: '',
    },
  })

  // Se já houver sessão ativa válida, redireciona para a home do perfil
  if (isAuthenticated && session) {
    const destino = obterDestinoAposLogin(session.perfil, fromPath)
    return <Navigate to={destino} replace />
  }

  const onSubmit = async (dados: LoginRequest) => {
    setErroApi(null)
    try {
      const resposta = await autenticarEmissor(dados)
      login({
        token: resposta.token,
        nome: resposta.nome,
        perfil: resposta.perfil,
      })
      const destino = obterDestinoAposLogin(resposta.perfil, fromPath)
      navigate(destino, { replace: true })
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setErroApi(err.mensagem || MSG_PADRAO_401)
        } else if (err.status === 400) {
          setErroApi(err.mensagem || MENSAGEM_ERRO_GENERICA)
        } else {
          setErroApi(MENSAGEM_ERRO_GENERICA)
        }
      } else {
        setErroApi(MENSAGEM_ERRO_GENERICA)
      }
    }
  }

  return (
    <div className={styles.container}>
      <section className={styles.card} aria-labelledby="login-title">
        <h1 id="login-title" className={styles.title}>
          Login do emissor
        </h1>
        <p className={styles.subtitle}>
          Acesse com suas credenciais para gerenciar e emitir certificados.
        </p>

        {sessaoExpirou && !erroApi && (
          <div className={styles.alert}>
            <Alert variant="warning">{MSG_SESSAO_EXPIRADA}</Alert>
          </div>
        )}

        {erroApi && (
          <div className={styles.alert}>
            <Alert variant="error">{erroApi}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className={styles.form} noValidate>
          <Field
            label="E-mail"
            type="email"
            autoComplete="username"
            required
            error={errors.email?.message}
            {...register('email')}
          />

          <Field
            label="Senha"
            type="password"
            autoComplete="current-password"
            required
            error={errors.senha?.message}
            {...register('senha')}
          />

          <div className={styles.actions}>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isSubmitting}
              loadingLabel="Entrando…"
              className={styles.submitButton}
            >
              Entrar
            </Button>
          </div>
        </form>
        <p className={styles.subtitle}><Link to="/emissor/cadastro">Solicitar cadastro</Link></p>
      </section>
    </div>
  )
}
