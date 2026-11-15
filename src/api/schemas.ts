import { z } from 'zod'

export const PerfilUsuarioSchema = z.enum(['EMISSOR', 'ADMINISTRADOR'])
export type PerfilUsuario = z.infer<typeof PerfilUsuarioSchema>

export const LoginRequestSchema = z.object({
  email: z.string().trim().min(1, 'O e-mail é obrigatório').email('E-mail inválido'),
  senha: z.string().min(1, 'A senha é obrigatória'),
})
export type LoginRequest = z.infer<typeof LoginRequestSchema>

export const LoginResponseSchema = z.object({
  token: z.string().min(1, 'Token não pode ser vazio'),
  nome: z.string(),
  perfil: z.preprocess(
    (val) => (typeof val === 'string' ? val.toUpperCase() : val),
    PerfilUsuarioSchema,
  ),
})
export type LoginResponse = z.infer<typeof LoginResponseSchema>

export const ValidarCertificadoResponseSchema = z.object({
  valido: z.boolean(),
  mensagem: z.string(),
  nomeAluno: z.string().optional(),
  curso: z.string().optional(),
  dataConclusao: z.string().optional(),
  hash: z.string().optional(),
})
export type ValidarCertificadoResponse = z.infer<typeof ValidarCertificadoResponseSchema>

export const RegistrarCertificadoResponseSchema = z.object({
  sucesso: z.boolean(),
  mensagem: z.string(),
  hash: z.string().trim().min(1),
})
export type RegistrarCertificadoResponse = z.infer<typeof RegistrarCertificadoResponseSchema>

export const RevogarCertificadoResponseSchema = z.object({
  sucesso: z.boolean(),
  mensagem: z.string(),
})
export type RevogarCertificadoResponse = z.infer<typeof RevogarCertificadoResponseSchema>

export const CertificadoResumoSchema = z.object({
  certificadoId: z.string().min(1),
  nomeAluno: z.string(),
  hash: z.string().transform((value) => value.trim().replace(/[\s\r\n]+/g, '')).pipe(z.string().min(1)),
  dataEmissao: z.string(),
  status: z.preprocess(
    (value) => (typeof value === 'string' ? value.toUpperCase() : value),
    z.enum(['VALIDO', 'INVALIDO']),
  ).transform((value) => value === 'VALIDO' ? 'valido' as const : 'invalido' as const),
  // TODO(contrato): CT15/card exige curso, mas o DTO atual do Backend 1 ainda não o devolve.
  curso: z.string().optional(),
})
export const ListarCertificadosResponseSchema = z.array(CertificadoResumoSchema)
export type CertificadoResumo = z.infer<typeof CertificadoResumoSchema>
