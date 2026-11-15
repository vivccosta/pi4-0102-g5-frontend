import { afterEach, describe, expect, it } from 'vitest'
import { getConfig } from './index'

describe('getConfig', () => {
  const originalConfig = window.__TIMBRO_CONFIG__

  afterEach(() => {
    window.__TIMBRO_CONFIG__ = originalConfig
  })

  it('lê configuração válida de window.__TIMBRO_CONFIG__', () => {
    window.__TIMBRO_CONFIG__ = {
      apiUrl: 'http://localhost:8080',
      wsUrl: 'ws://localhost:8080',
    }

    const config = getConfig()
    expect(config.apiUrl).toBe('http://localhost:8080')
    expect(config.wsUrl).toBe('ws://localhost:8080')
  })

  it('lança erro se window.__TIMBRO_CONFIG__ não estiver definida', () => {
    window.__TIMBRO_CONFIG__ = undefined

    expect(() => getConfig()).toThrow(/Configuração do Timbro inválida ou ausente/)
  })

  it('lança erro se apiUrl for inválida', () => {
    window.__TIMBRO_CONFIG__ = {
      apiUrl: 'url-invalida',
    }

    expect(() => getConfig()).toThrow(/apiUrl/)
  })
})
