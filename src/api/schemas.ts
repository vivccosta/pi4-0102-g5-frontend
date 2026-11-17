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

export const CadastrarEmissorRequestSchema = z.object({
  nome: z.string().trim().min(1, 'O nome do emissor é obrigatório'),
  email: z.string().trim().min(1, 'O e-mail é obrigatório').email('E-mail inválido'),
  cnpj: z.string().regex(/^\d{14}$/, 'Informe um CNPJ válido'),
  // TODO(contrato): confirmar com o grupo se a senha deve ter mínimo de 8 caracteres.
  senha: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
})
export type CadastrarEmissorRequest = z.infer<typeof CadastrarEmissorRequestSchema>

export const CadastrarEmissorResponseSchema = z.string()
export type CadastrarEmissorResponse = z.infer<typeof CadastrarEmissorResponseSchema>

export const ValidarCertificadoResponseSchema = z.object({
  valido: z.boolean().optional(),
  status: z.preprocess(
    (value) => typeof value === 'string' ? value.toUpperCase() : value,
    z.enum(['VALIDO', 'INVALIDO']),
  ).optional(),
  mensagem: z.string(),
  nomeAluno: z.string().nullish(),
  curso: z.string().nullish(),
  dataConclusao: z.string().nullish(),
  hash: z.string().nullish(),
}).superRefine((data, context) => {
  if (data.valido === undefined && data.status === undefined) {
    context.addIssue({ code: 'custom', path: ['status'], message: 'A resposta não informa o resultado da validação.' })
  }
}).transform((data) => ({ ...data, valido: data.valido ?? data.status?.toUpperCase() === 'VALIDO' }))
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
  certificadoId: z.union([z.string(), z.number()]).transform(String).optional(),
  nomeAluno: z.string(),
  hash: z.string().transform((value) => value.trim().replace(/[\s\r\n]+/g, '')).pipe(z.string().min(1)),
  dataEmissao: z.string(),
  status: z.preprocess(
    (value) => (typeof value === 'string' ? value.toUpperCase() : value),
    z.enum(['VALIDO', 'INVALIDO']),
  ).transform((value) => value === 'VALIDO' ? 'valido' as const : 'invalido' as const),
  // TODO(contrato): CT15/card exige curso, mas o DTO atual do Backend 1 ainda não o devolve.
  curso: z.string().nullish(),
})
export const ListarCertificadosResponseSchema = z.union([z.array(CertificadoResumoSchema), z.object({ certificados: z.array(CertificadoResumoSchema) }).transform(({ certificados }) => certificados)])
export type CertificadoResumo = z.infer<typeof CertificadoResumoSchema>

export const EmissorPendenteSchema = z.object({
  emissorId: z.union([z.string(), z.number()]).transform(String),
  nome: z.string(),
  email: z.string(),
  cnpj: z.string().optional(),
  cnpjCpf: z.string().optional(),
  status: z.string(),
  // TODO(contrato): CT17 solicita documentação, mas o DTO atual não envia esse campo.
  documentacao: z.union([z.string(), z.array(z.string())]).optional(),
})
export const ListarEmissoresPendentesResponseSchema = z.array(EmissorPendenteSchema)
export type EmissorPendente = z.infer<typeof EmissorPendenteSchema>

export const AtivarEmissorResponseSchema = z.string()
