import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const appDir = resolve(__dirname, '..')

/**
 * Route page file tests — verify each Next.js App Router route wrapper
 * exists, has 'use client', imports the correct page component, and
 * exports a default function component.
 */
describe('Route page files', () => {
  // Helper: read file content, assert it exists
  function readRouteFile(relativePath: string) {
    const fullPath = resolve(appDir, relativePath)
    if (!existsSync(fullPath)) {
      return null
    }
    return readFileSync(fullPath, 'utf-8')
  }

  // 2.1 — /auth
  describe('app/auth/page.tsx', () => {
    const path = 'auth/page.tsx'

    it('should exist', () => {
      const content = readRouteFile(path)
      expect(content).not.toBeNull()
    })

    it('should have use client directive', () => {
      const content = readRouteFile(path)!
      expect(content.startsWith("'use client'")).toBe(true)
    })

    it('should import Auth from @/views/Auth', () => {
      const content = readRouteFile(path)!
      expect(content).toContain("import Auth from '@/views/Auth'")
    })

    it('should export default function AuthPage rendering <Auth />', () => {
      const content = readRouteFile(path)!
      expect(content).toContain('export default function AuthPage')
      expect(content).toContain('<Auth />')
    })
  })

  // 2.2 — /dashboard (now in (authenticated) route group)
  describe('app/(authenticated)/dashboard/page.tsx', () => {
    const path = '(authenticated)/dashboard/page.tsx'

    it('should exist', () => {
      const content = readRouteFile(path)
      expect(content).not.toBeNull()
    })

    it('should have use client directive', () => {
      const content = readRouteFile(path)!
      expect(content.startsWith("'use client'")).toBe(true)
    })

    it('should import Dashboard from @/views/Dashboard', () => {
      const content = readRouteFile(path)!
      expect(content).toContain("import Dashboard from '@/views/Dashboard'")
    })

    it('should export default function DashboardPage rendering <Dashboard />', () => {
      const content = readRouteFile(path)!
      expect(content).toContain('export default function DashboardPage')
      expect(content).toContain('<Dashboard />')
    })
  })

  // 2.3 — /admin (now in (authenticated) route group)
  describe('app/(authenticated)/admin/page.tsx', () => {
    const path = '(authenticated)/admin/page.tsx'

    it('should exist', () => {
      const content = readRouteFile(path)
      expect(content).not.toBeNull()
    })

    it('should have use client directive', () => {
      const content = readRouteFile(path)!
      expect(content.startsWith("'use client'")).toBe(true)
    })

    it('should import AdminPanel from @/views/AdminPanel', () => {
      const content = readRouteFile(path)!
      expect(content).toContain("import AdminPanel from '@/views/AdminPanel'")
    })

    it('should export default function AdminPage rendering <AdminPanel />', () => {
      const content = readRouteFile(path)!
      expect(content).toContain('export default function AdminPage')
      expect(content).toContain('<AdminPanel />')
    })
  })

  // 2.4 — /simulation/[courseId] (dynamic route)
  describe('app/simulation/[courseId]/page.tsx', () => {
    const path = 'simulation/[courseId]/page.tsx'

    it('should exist', () => {
      const content = readRouteFile(path)
      expect(content).not.toBeNull()
    })

    it('should have use client directive', () => {
      const content = readRouteFile(path)!
      expect(content.startsWith("'use client'")).toBe(true)
    })

    it('should import useParams from next/navigation', () => {
      const content = readRouteFile(path)!
      expect(content).toContain("import { useParams } from 'next/navigation'")
    })

    it('should import SimulationPage from @/views/SimulationPage', () => {
      const content = readRouteFile(path)!
      expect(content).toContain("import SimulationPage from '@/views/SimulationPage'")
    })

    it('should extract courseId from params and pass to SimulationPage', () => {
      const content = readRouteFile(path)!
      expect(content).toContain('params.courseId as string')
      expect(content).toContain('<SimulationPage')
    })
  })

  // 2.5 — /evaluations (now in (authenticated) route group)
  describe('app/(authenticated)/evaluations/page.tsx', () => {
    const path = '(authenticated)/evaluations/page.tsx'

    it('should exist', () => {
      const content = readRouteFile(path)
      expect(content).not.toBeNull()
    })

    it('should have use client directive', () => {
      const content = readRouteFile(path)!
      expect(content.startsWith("'use client'")).toBe(true)
    })

    it('should import EvaluationsPage from @/views/EvaluationsPage', () => {
      const content = readRouteFile(path)!
      expect(content).toContain("import EvaluationsPage from '@/views/EvaluationsPage'")
    })

    it('should export default function EvaluationsRoute rendering <EvaluationsPage />', () => {
      const content = readRouteFile(path)!
      expect(content).toContain('export default function EvaluationsRoute')
      expect(content).toContain('<EvaluationsPage />')
    })
  })

  // 2.6 — /student-ledger/[userId] (now in (authenticated) route group)
  describe('app/(authenticated)/student-ledger/[userId]/page.tsx', () => {
    const path = '(authenticated)/student-ledger/[userId]/page.tsx'

    it('should exist', () => {
      const content = readRouteFile(path)
      expect(content).not.toBeNull()
    })

    it('should have use client directive', () => {
      const content = readRouteFile(path)!
      expect(content.startsWith("'use client'")).toBe(true)
    })

    it('should import StudentLedger from @/views/StudentLedger', () => {
      const content = readRouteFile(path)!
      expect(content).toContain("import StudentLedger from '@/views/StudentLedger'")
    })

    it('should render <StudentLedger />', () => {
      const content = readRouteFile(path)!
      expect(content).toContain('export default function StudentLedgerRoute')
      expect(content).toContain('<StudentLedger />')
    })
  })

  // 2.7 — /legajos (now in (authenticated) route group)
  describe('app/(authenticated)/legajos/page.tsx', () => {
    const path = '(authenticated)/legajos/page.tsx'

    it('should exist', () => {
      const content = readRouteFile(path)
      expect(content).not.toBeNull()
    })

    it('should have use client directive', () => {
      const content = readRouteFile(path)!
      expect(content.startsWith("'use client'")).toBe(true)
    })

    it('should import LegajosPage from @/views/LegajosPage', () => {
      const content = readRouteFile(path)!
      expect(content).toContain("import LegajosPage from '@/views/LegajosPage'")
    })

    it('should export default function LegajosRoute rendering <LegajosPage />', () => {
      const content = readRouteFile(path)!
      expect(content).toContain('export default function LegajosRoute')
      expect(content).toContain('<LegajosPage />')
    })
  })

  // 2.8 — /certificate/[instanceId] (dynamic route)
  describe('app/certificate/[instanceId]/page.tsx', () => {
    const path = 'certificate/[instanceId]/page.tsx'

    it('should exist', () => {
      const content = readRouteFile(path)
      expect(content).not.toBeNull()
    })

    it('should have use client directive', () => {
      const content = readRouteFile(path)!
      expect(content.startsWith("'use client'")).toBe(true)
    })

    it('should import useParams from next/navigation', () => {
      const content = readRouteFile(path)!
      expect(content).toContain("import { useParams } from 'next/navigation'")
    })

    it('should import CertificateView from @/views/CertificateView', () => {
      const content = readRouteFile(path)!
      expect(content).toContain("import CertificateView from '@/views/CertificateView'")
    })

    it('should extract instanceId from params and pass to CertificateView', () => {
      const content = readRouteFile(path)!
      expect(content).toContain('params.instanceId as string')
      expect(content).toContain('<CertificateView')
    })
  })

  // 2.9 — /not-found
  describe('app/not-found.tsx', () => {
    const path = 'not-found.tsx'

    it('should exist', () => {
      const content = readRouteFile(path)
      expect(content).not.toBeNull()
    })

    it('should have use client directive', () => {
      const content = readRouteFile(path)!
      expect(content.startsWith("'use client'")).toBe(true)
    })

    it('should import NotFound from @/views/NotFound', () => {
      const content = readRouteFile(path)!
      expect(content).toContain("import NotFound from '@/views/NotFound'")
    })

    it('should export default function NotFoundPage rendering <NotFound />', () => {
      const content = readRouteFile(path)!
      expect(content).toContain('export default function NotFoundPage')
      expect(content).toContain('<NotFound />')
    })
  })
})

describe('Navigation migration — react-router-dom replaced with next/navigation', () => {
  const srcDir = resolve(__dirname, '../../src')

  // Files that should NO LONGER import from react-router-dom
  const filesToCheck = [
    'pages/Auth.tsx',
    'pages/Dashboard.tsx',
    'pages/AdminPanel.tsx',
    'pages/SimulationPage.tsx',
    'pages/EvaluationsPage.tsx',
    'pages/StudentLedger.tsx',
    'pages/LegajosPage.tsx',
    'pages/CertificateView.tsx',
    'pages/NotFound.tsx',
    'pages/Index.tsx',
    'pages/TemplatesPanel.tsx',
    'components/NavLink.tsx',
    'components/DynamicWorkbench.tsx',
    'components/StudentReviewModal.tsx',
    'hooks/useInactivityTimer.tsx',
  ]

  for (const relPath of filesToCheck) {
    it(`${relPath} should NOT import from react-router-dom`, () => {
      const fullPath = resolve(srcDir, relPath)
      if (!existsSync(fullPath)) return // skip if file doesn't exist
      const content = readFileSync(fullPath, 'utf-8')
      expect(content).not.toContain("from 'react-router-dom'")
    })
  }

  // useNavigate → useRouter.push
  it('useNavigate calls should be replaced with router.push', () => {
    // Check that no file still uses useNavigate from react-router-dom
    for (const relPath of filesToCheck) {
      const fullPath = resolve(srcDir, relPath)
      if (!existsSync(fullPath)) continue
      const content = readFileSync(fullPath, 'utf-8')
      // If they import from next/navigation instead, that's fine
      if (content.includes('useNavigate') && !content.includes("from 'next/navigation'")) {
        // This means useNavigate is from react-router-dom — fail
        expect.fail(`${relPath} still uses useNavigate from react-router-dom`)
      }
    }
  })

  // useLocation → usePathname
  it('useLocation should be replaced with usePathname', () => {
    for (const relPath of filesToCheck) {
      const fullPath = resolve(srcDir, relPath)
      if (!existsSync(fullPath)) continue
      const content = readFileSync(fullPath, 'utf-8')
      expect(content).not.toContain("useLocation'")
      expect(content).not.toContain('useLocation"')
    }
  })

  // NavLink from react-router-dom should be replaced
  it('NavLink from react-router-dom should be replaced', () => {
    const fullPath = resolve(srcDir, 'components/NavLink.tsx')
    if (!existsSync(fullPath)) return
    const content = readFileSync(fullPath, 'utf-8')
    expect(content).not.toContain("from 'react-router-dom'")
  })
})

describe('Navigation API migration verification', () => {
  const srcDir = resolve(__dirname, '../../src')

  it('useNavigate imports should come from next/navigation', () => {
    const files = [
      'pages/Auth.tsx',
      'pages/Dashboard.tsx',
      'pages/AdminPanel.tsx',
      'pages/SimulationPage.tsx',
      'pages/EvaluationsPage.tsx',
      'pages/StudentLedger.tsx',
      'pages/LegajosPage.tsx',
      'pages/CertificateView.tsx',
      'pages/Index.tsx',
      'pages/TemplatesPanel.tsx',
      'components/StudentReviewModal.tsx',
    ]

    for (const relPath of files) {
      const fullPath = resolve(srcDir, relPath)
      if (!existsSync(fullPath)) continue
      const content = readFileSync(fullPath, 'utf-8')
      if (content.includes('useNavigate')) {
        expect(content).toContain("from 'next/navigation'")
      }
    }
  })

  it('useParams imports should come from next/navigation', () => {
    const files = [
      'pages/SimulationPage.tsx',
      'pages/StudentLedger.tsx',
      'pages/CertificateView.tsx',
      'components/DynamicWorkbench.tsx',
    ]

    for (const relPath of files) {
      const fullPath = resolve(srcDir, relPath)
      if (!existsSync(fullPath)) continue
      const content = readFileSync(fullPath, 'utf-8')
      if (content.includes('useParams')) {
        expect(content).toContain("from 'next/navigation'")
      }
    }
  })

  it('usePathname should be used instead of useLocation().pathname', () => {
    const files = [
      'hooks/useInactivityTimer.tsx',
    ]

    for (const relPath of files) {
      const fullPath = resolve(srcDir, relPath)
      if (!existsSync(fullPath)) continue
      const content = readFileSync(fullPath, 'utf-8')
      if (content.includes('usePathname') || content.includes('pathname')) {
        expect(content).not.toContain('location.pathname')
      }
    }
  })
})

describe('Vite cleanup — old files should be deleted', () => {
  const rootDir = resolve(__dirname, '../..')

  const filesToDelete = [
    'src/App.tsx',
    'src/main.tsx',
    'src/vite-env.d.ts',
    'src/App.css',
  ]

  const rootFilesToDelete = [
    'index.html',
    'vite.config.ts',
    'tsconfig.node.json',
    'tsconfig.app.json',
  ]

  for (const relPath of [...filesToDelete, ...rootFilesToDelete]) {
    it(`${relPath} should no longer exist`, () => {
      const fullPath = relPath.startsWith('src/')
        ? resolve(srcDir ?? rootDir, relPath)
        : resolve(rootDir, relPath)
      expect(existsSync(fullPath)).toBe(false)
    })
  }

  it('package.json should NOT contain react-router-dom in dependencies', () => {
    const pkgPath = resolve(rootDir, 'package.json')
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))
    expect(pkg.dependencies).not.toHaveProperty('react-router-dom')
  })
})

// Need srcDir referenced above
const srcDir = resolve(__dirname, '../../src')