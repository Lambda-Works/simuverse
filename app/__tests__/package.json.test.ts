import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const pkgPath = resolve(__dirname, '../../package.json')

describe('package.json', () => {
  it('should have dev script pointing to next dev on port 8080', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    expect(pkg.scripts.dev).toBe('next dev --port 8080')
  })

  it('should have build script pointing to next build', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    expect(pkg.scripts.build).toBe('next build')
  })

  it('should have start script pointing to next start on port 8080', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    expect(pkg.scripts.start).toBe('next start --port 8080')
  })

  it('should preserve test script', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    expect(pkg.scripts.test).toBe('vitest run')
  })

  it('should preserve lint script', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    expect(pkg.scripts.lint).toBe('eslint .')
  })

  it('should have next as a dependency', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    expect(pkg.dependencies).toHaveProperty('next')
    expect(pkg.dependencies.next).toMatch(/\^15/)
  })

  it('should have react 19', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    expect(pkg.dependencies).toHaveProperty('react')
    expect(pkg.dependencies.react).toMatch(/\^19/)
  })

  it('should have react-dom 19', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    expect(pkg.dependencies).toHaveProperty('react-dom')
    expect(pkg.dependencies['react-dom']).toMatch(/\^19/)
  })

  it('should NOT have vite in dependencies', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    expect(pkg.dependencies).not.toHaveProperty('vite')
  })

  it('should have vite in devDependencies for vitest', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    expect(pkg.devDependencies).toHaveProperty('vite')
    expect(pkg.dependencies).not.toHaveProperty('vite')
  })

  it('should NOT have @vitejs/plugin-react-swc in devDependencies', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    expect(pkg.devDependencies).not.toHaveProperty('@vitejs/plugin-react-swc')
  })

  it('should NOT have @vitejs/plugin-react in devDependencies', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    expect(pkg.devDependencies).not.toHaveProperty('@vitejs/plugin-react')
  })

  // Triangulation: all other critical dependencies must be preserved
  it('should preserve @tanstack/react-query in dependencies', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    expect(pkg.dependencies).toHaveProperty('@tanstack/react-query')
  })

  it('should preserve cypress scripts', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    expect(pkg.scripts).toHaveProperty('cypress:open')
    expect(pkg.scripts).toHaveProperty('cypress:e2e')
  })

  it('should NOT have lovable-tagger in devDependencies', () => {
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    expect(pkg.devDependencies).not.toHaveProperty('lovable-tagger')
  })
})