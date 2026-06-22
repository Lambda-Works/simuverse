import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const tsconfigPath = resolve(__dirname, '../../tsconfig.json')

describe('tsconfig.json', () => {
  it('should target ES2017', () => {
    const config = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))
    expect(config.compilerOptions.target).toBe('ES2017')
  })

  it('should include dom and dom.iterable libs', () => {
    const config = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))
    expect(config.compilerOptions.lib).toContain('dom')
    expect(config.compilerOptions.lib).toContain('dom.iterable')
    expect(config.compilerOptions.lib).toContain('esnext')
  })

  it('should have Next.js plugin', () => {
    const config = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))
    expect(config.compilerOptions.plugins).toBeDefined()
    expect(config.compilerOptions.plugins[0].name).toBe('next')
  })

  it('should preserve jsx for Next.js', () => {
    const config = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))
    expect(config.compilerOptions.jsx).toBe('preserve')
  })

  it('should use bundler module resolution', () => {
    const config = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))
    expect(config.compilerOptions.moduleResolution).toBe('bundler')
  })

  it('should keep @/* path alias mapping to ./src/*', () => {
    const config = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))
    expect(config.compilerOptions.paths['@/*']).toContain('./src/*')
  })

  it('should include next-env.d.ts in include array', () => {
    const config = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))
    expect(config.include).toContain('next-env.d.ts')
  })

  it('should include .next/types/**/*.ts in include array', () => {
    const config = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))
    expect(config.include).toContain('.next/types/**/*.ts')
  })

  it('should NOT reference tsconfig.app.json or tsconfig.node.json', () => {
    const config = JSON.parse(readFileSync(tsconfigPath, 'utf-8'))
    expect(config).not.toHaveProperty('references')
  })
})