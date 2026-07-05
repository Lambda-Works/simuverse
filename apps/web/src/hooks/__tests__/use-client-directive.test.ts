/**
 * Structural SSR Safety Tests for 'use client' directives
 *
 * Verifies that ALL React hook-using files in the project have the
 * 'use client' directive as the first line, which is required for
 * Next.js App Router SSR compatibility.
 *
 * Without 'use client', Next.js will attempt to render these components
 * on the server, which will crash when they access browser APIs
 * (useState, useEffect, localStorage, navigator, window, etc.)
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ─── Helper ────────────────────────────────────────────────────────────────────

const SRC_DIR = resolve(__dirname, '../..')

/** Check that a file starts with 'use client' directive */
function hasUseClientDirective(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8')
    const firstLine = content.split('\n')[0].trim()
    return firstLine === "'use client'" || firstLine === '"use client"'
  } catch {
    return false
  }
}

// ─── Hook files MUST have 'use client' ──────────────────────────────────────────

describe('use client directive — hooks', () => {
  const hookFiles = [
    'useAuth.tsx',
    'useInactivityTimer.tsx',
    'use-mobile.tsx',
    'useServiceWorker.ts',
    'use-toast.ts',
  ]

  hookFiles.forEach((file) => {
    it(`${file} has 'use client' directive`, () => {
      const filePath = resolve(SRC_DIR, 'hooks', file)
      expect(hasUseClientDirective(filePath)).toBe(true)
    })
  })
})

// ─── Component files MUST have 'use client' ────────────────────────────────────

describe('use client directive — components', () => {
  const componentFiles = [
    'NavLink.tsx',
    'DynamicWorkbench.tsx',
    'DynamicInterface.tsx',
    'StudentReviewModal.tsx',
    'SimulationSessionViewer.tsx',
    'SimulationCalendar.tsx',
    'GlobalStatsDashboard.tsx',
    'AccessRequestsPanel.tsx',
    'StudentCertificate.tsx',
  ]

  componentFiles.forEach((file) => {
    it(`${file} has 'use client' directive`, () => {
      const filePath = resolve(SRC_DIR, 'components', file)
      expect(hasUseClientDirective(filePath)).toBe(true)
    })
  })
})

// ─── ABM component files MUST have 'use client' ───────────────────────────────

describe('use client directive — ABM components', () => {
  const abmFiles = [
    'TemplatesABM.tsx',
    'DocumentsABM.tsx',
    'TechSheetsABM.tsx',
    'ScenariosABM.tsx',
    'CategoriesABM.tsx',
    'ReportsABM.tsx',
    'AssignmentsABM.tsx',
    'UsersABM.tsx',
    'RolesABM.tsx',
    'TeacherGroupsABM.tsx',
    'CompaniesABM.tsx',
    'FoundationABM.tsx',
    'EndorsersABM.tsx',
    'PromptTemplatesABM.tsx',
  ]

  abmFiles.forEach((file) => {
    it(`${file} has 'use client' directive`, () => {
      const filePath = resolve(SRC_DIR, 'components', file)
      expect(hasUseClientDirective(filePath)).toBe(true)
    })
  })
})

// ─── Module component files MUST have 'use client' ─────────────────────────────

describe('use client directive — module components', () => {
  const moduleFiles = [
    'ChatIAModule.tsx',
    'InboxModule.tsx',
    'DocumentModule.tsx',
    'CalculatorModule.tsx',
    'DocumentationModule.tsx',
    'ToolsModule.tsx',
    'CommunicationModule.tsx',
  ]

  moduleFiles.forEach((file) => {
    it(`${file} has 'use client' directive`, () => {
      const filePath = resolve(SRC_DIR, 'components', 'modules', file)
      expect(hasUseClientDirective(filePath)).toBe(true)
    })
  })
})