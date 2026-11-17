import { beforeEach, describe, expect, it } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import { cadastrarEmissor } from './emissores'

describe('cadastrarEmissor', () => {
  beforeEach(() => { window.__TIMBRO_CONFIG__ = { apiUrl: 'http://localhost:8080' } })

  it('envia JSON sem autenticação e aceita 201 com texto puro', async () => {
    await expect(cadastrarEmissor({ nome: 'Escola', email: 'escola@timbro.test', cnpj: '11222333000181', senha: 'senha123' }))
      .resolves.toBe('Cadastro realizado com sucesso. Aguardando aprovação do administrador.')
  })

  it('preserva o erro de negócio 400 do backend', async () => {
    await expect(cadastrarEmissor({ nome: 'Escola', email: 'cadastrado@timbro.test', cnpj: '11222333000181', senha: 'senha123' }))
      .rejects.toMatchObject({ status: 400, mensagem: 'Email já cadastrado.' })
  })

  it('não vaza mensagem técnica de indisponibilidade', async () => {
    server.use(http.post('*/api/emissores/cadastrar', () => HttpResponse.json({ mensagem: 'detalhe interno' }, { status: 500 })))
    await expect(cadastrarEmissor({ nome: 'Escola', email: 'escola@timbro.test', cnpj: '11222333000181', senha: 'senha123' }))
      .rejects.toMatchObject({ status: 500, mensagem: 'Não foi possível concluir a operação agora. Tente novamente em instantes.' })
  })
})
