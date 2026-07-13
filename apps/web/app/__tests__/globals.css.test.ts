import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'

const globalsCssPath = resolve(__dirname, '../globals.css')

describe('app/globals.css', () => {
  it('should contain the Tailwind directives', () => {
    const content = readFileSync(globalsCssPath, 'utf-8')
    expect(content).toContain('@tailwind base')
    expect(content).toContain('@tailwind components')
    expect(content).toContain('@tailwind utilities')
  })

  it('should contain CSS variable definitions matching the source', () => {
    const source = readFileSync(resolve(__dirname, '../../src/index.css'), 'utf-8')
    const globals = readFileSync(globalsCssPath, 'utf-8')
    // Key variables must be present in both files
    expect(globals).toContain('--background:')
    expect(globals).toContain('--primary:')
    expect(globals).toContain('--crisis:')
    expect(globals).toContain('.dark')
    // Must match the source inject
    expect(globals.trim()).toBe(source.trim())
  })

  it('should contain utility class definitions', () => {
    const content = readFileSync(globalsCssPath, 'utf-8')
    expect(content).toContain('.glass-card')
    expect(content).toContain('.crisis-pulse')
    expect(content).toContain('.fade-in')
    expect(content).toContain('.slide-in-right')
  })
})
