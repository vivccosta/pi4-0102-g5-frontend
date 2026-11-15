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
