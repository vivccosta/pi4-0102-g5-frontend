import { describe, expect, it } from 'vitest'
import { queryClient } from './queryClient'

describe('queryClient', () => {
  it('configura no máximo 1 retry para queries', () => {
    expect(queryClient.getDefaultOptions().queries?.retry).toBe(1)
  })

  it('configura 0 retry para mutations', () => {
    expect(queryClient.getDefaultOptions().mutations?.retry).toBe(0)
  })
})
