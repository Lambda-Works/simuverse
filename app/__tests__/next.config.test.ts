import { describe, it, expect } from 'vitest'

describe('next.config.ts', () => {
  it('should export reactStrictMode as true', async () => {
    const mod = await import('../../next.config')
    const config = mod.default
    expect(config.reactStrictMode).toBe(true)
  })

  it('should be a valid NextConfig object with required fields', async () => {
    const mod = await import('../../next.config')
    const config = mod.default
    expect(config).toBeDefined()
    expect(typeof config).toBe('object')
    expect(config.reactStrictMode).toBe(true)
  })
})
