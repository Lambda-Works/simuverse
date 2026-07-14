import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'

const twConfigPath = resolve(__dirname, '../../tailwind.config.ts')

describe('tailwind.config.ts', () => {
  it('should include app directory in content array', () => {
    const content = readFileSync(twConfigPath, 'utf-8')
    expect(content).toContain('"./app/**/*.{ts,tsx}"')
  })

  it('should preserve existing src content path', () => {
    const content = readFileSync(twConfigPath, 'utf-8')
    expect(content).toContain('"./src/**/*.{ts,tsx}"')
  })

  it('should preserve existing pages content path', () => {
    const content = readFileSync(twConfigPath, 'utf-8')
    expect(content).toContain('"./pages/**/*.{ts,tsx}"')
  })

  it('should preserve existing components content path', () => {
    const content = readFileSync(twConfigPath, 'utf-8')
    expect(content).toContain('"./components/**/*.{ts,tsx}"')
  })

  it('should still use class-based dark mode', () => {
    const content = readFileSync(twConfigPath, 'utf-8')
    expect(content).toContain('darkMode')
    expect(content).toContain('"class"')
  })

  it('should still have the animation plugins', () => {
    const content = readFileSync(twConfigPath, 'utf-8')
    expect(content).toContain('tailwindcss-animate')
  })
})