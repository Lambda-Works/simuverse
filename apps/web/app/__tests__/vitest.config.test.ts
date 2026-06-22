import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const vitestConfigPath = resolve(__dirname, '../../vitest.config.ts')

describe('vitest.config.ts', () => {
  it('should NOT import @vitejs/plugin-react', () => {
    const content = readFileSync(vitestConfigPath, 'utf-8')
    expect(content).not.toContain('@vitejs/plugin-react')
  })

  it('should NOT import @vitejs/plugin-react-swc', () => {
    const content = readFileSync(vitestConfigPath, 'utf-8')
    expect(content).not.toContain('@vitejs/plugin-react-swc')
  })

  it('should use esbuild jsx automatic for React JSX transformation', () => {
    const content = readFileSync(vitestConfigPath, 'utf-8')
    expect(content).toContain("jsx: 'automatic'")
    expect(content).toContain('jsxImportSource')
  })

  it('should not use plugins: [react()] pattern', () => {
    const content = readFileSync(vitestConfigPath, 'utf-8')
    expect(content).not.toContain("plugins: [react()]")
    expect(content).not.toContain("plugins:[react()]")
  })

  it('should include app directory in test include pattern', () => {
    const content = readFileSync(vitestConfigPath, 'utf-8')
    expect(content).toContain('app/**/*.{test,spec}.{ts,tsx}')
  })

  it('should use jsdom environment', () => {
    const content = readFileSync(vitestConfigPath, 'utf-8')
    expect(content).toContain("environment:")
    expect(content).toContain('"jsdom"')
  })

  it('should preserve @ path alias resolution', () => {
    const content = readFileSync(vitestConfigPath, 'utf-8')
    expect(content).toContain('"@"')
    expect(content).toContain('./src')
  })

  // Triangulation: verify the esbuild config block exists and is well-formed
  it('should define esbuild block with jsx and jsxImportSource keys', () => {
    const content = readFileSync(vitestConfigPath, 'utf-8')
    // Must have the esbuild: { ... } block
    expect(content).toContain('esbuild:')
    // Both keys must be present in the block
    expect(content).toMatch(/jsx:\s*['"]automatic['"]/)
    expect(content).toMatch(/jsxImportSource:\s*['"]react['"]/)
  })

  // Edge case: config must NOT reference vite or @vitejs packages as dependencies
  it('should NOT import vite or @vitejs packages', () => {
    const content = readFileSync(vitestConfigPath, 'utf-8')
    const importLines = content.split('\n').filter(l => l.trim().startsWith('import '))
    for (const line of importLines) {
      // vitest/config is fine — it's the test runner, not vite
      expect(line).not.toMatch(/from\s+['"]vite['"]/)
      expect(line).not.toContain('@vitejs/')
    }
  })
})
