import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'

const envLocalPath = resolve(__dirname, '../../.env.local')
const envPath = resolve(__dirname, '../../.env')

describe('.env.local', () => {
  it('should exist and be non-empty', () => {
    const content = readFileSync(envLocalPath, 'utf-8')
    expect(content.length).toBeGreaterThan(0)
  })

  it('should have NEXT_PUBLIC_ prefix instead of VITE_', () => {
    const content = readFileSync(envLocalPath, 'utf-8')
    const lines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'))
    for (const line of lines) {
      const [key] = line.split('=')
      expect(key.trim().startsWith('NEXT_PUBLIC_')).toBe(true)
    }
  })

  it('should NOT contain any VITE_ prefixed keys', () => {
    const content = readFileSync(envLocalPath, 'utf-8')
    const lines = content.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'))
    for (const line of lines) {
      const [key] = line.split('=')
      expect(key.trim().startsWith('VITE_')).toBe(false)
    }
  })

  it('should map VITE_API_URL to NEXT_PUBLIC_API_URL', () => {
    const content = readFileSync(envLocalPath, 'utf-8')
    expect(content).toContain('NEXT_PUBLIC_API_URL=http://localhost:5001/api')
  })

  it('should map VITE_APP_NAME to NEXT_PUBLIC_APP_NAME', () => {
    const content = readFileSync(envLocalPath, 'utf-8')
    expect(content).toContain('NEXT_PUBLIC_APP_NAME=MSM - Motor de Simulación Modular')
  })

  it('should map VITE_GEMINI_API_KEY to NEXT_PUBLIC_GEMINI_API_KEY', () => {
    const content = readFileSync(envLocalPath, 'utf-8')
    expect(content).toContain('NEXT_PUBLIC_GEMINI_API_KEY')
  })

  it('should preserve the same number of key-value entries as .env', () => {
    const envContent = readFileSync(envPath, 'utf-8')
    const localContent = readFileSync(envLocalPath, 'utf-8')
    const envKvLines = envContent.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'))
    const localKvLines = localContent.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'))
    expect(localKvLines.length).toBe(envKvLines.length)
  })
})