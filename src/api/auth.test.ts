import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from './errors'
import { autenticarEmissor } from './auth'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

describe('autenticarEmissor (CT1/CT3)', () => {
  beforeEach(() => {
    window.__TIMBRO_CONFIG__ = {
      apiUrl: 'http://localhost:8080',
    }
  })

  it('autentica com sucesso um emissor ativo', async () => {
    const res = await autenticarEmissor({
      email: 'emissor@timbro.test',
      senha: 'Senha@123',
    })

    expect(res.perfil).toBe('EMISSOR')
    expect(res.nome).toBe('Emissor Demonstração')
    expect(res.token).toBeTruthy()
    expect(res.token.split('.')).toHaveLength(3)
  })

  it('autentica com sucesso um administrador', async () => {
    const res = await autenticarEmissor({
      email: 'admin@timbro.test',
      senha: 'Senha@123',
    })

    expect(res.perfil).toBe('ADMINISTRADOR')
    expect(res.nome).toBe('Administrador Timbro')
    expect(res.token).toBeTruthy()
  })

  it('retorna erro 401 com mensagem específica quando o cadastro do emissor estiver pendente', async () => {
    await expect(
      autenticarEmissor({
        email: 'pendente@timbro.test',
        senha: 'Senha@123',
      }),
    ).rejects.toMatchObject({
      kind: 'http',
      status: 401,
      mensagem: 'Acesso não autorizado. O cadastro do emissor ainda está pendente.',
    })
  })

  it('retorna erro 401 com mensagem padrão para credenciais não cadastradas ou inválidas', async () => {
    await expect(
      autenticarEmissor({
        email: 'desconhecido@timbro.test',
        senha: 'SenhaErrada123',
      }),
    ).rejects.toMatchObject({
      kind: 'http',
      status: 401,
      mensagem:
        'Acesso não autorizado. Apenas emissores cadastrados podem acessar esta área.',
    })
  })

  it('retorna erro 400 se campos forem enviados em branco', async () => {
    await expect(
      autenticarEmissor({
        email: ' ',
        senha: '',
      }),
    ).rejects.toMatchObject({
      kind: 'http',
      status: 400,
    })
  })

  it('lança erro de contrato quando a resposta da API violar o schema', async () => {
    server.use(
      http.post('*/api/auth/login', () => {
        return HttpResponse.json({
          // token ausente propositalmente
          nome: 'Nome sem token',
          perfil: 'EMISSOR',
        })
      }),
    )

    await expect(
      autenticarEmissor({
        email: 'emissor@timbro.test',
        senha: 'Senha@123',
      }),
    ).rejects.toBeInstanceOf(ApiError)
  })
})
