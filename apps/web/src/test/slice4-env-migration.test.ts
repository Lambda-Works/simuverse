/**
 * Slice 4 — Environment Variable Migration Tests
 * Ensures all VITE_* env vars are replaced with NEXT_PUBLIC_* equivalents.
 */
import { readFileSync, readdirSync, statSync } from 'fs';
import { extname, join } from 'path';
import { describe, expect, it } from 'vitest';

/**
 * Recursively collect all .ts/.tsx files under a directory (skips node_modules, .next, dist).
 */
function collectSourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (['node_modules', '.next', 'dist', '__tests__'].includes(entry)) continue;
      collectSourceFiles(full, acc);
    } else if (['.ts', '.tsx'].includes(extname(entry))) {
      acc.push(full);
    }
  }
  return acc;
}

const ROOT = join(__dirname, '..', '..');
const SRC_DIR = join(ROOT, 'src');
const APP_DIR = join(ROOT, 'app');

/** Files that legitimately reference the pattern in test assertions */
const EXEMPT_FILES = [join(__dirname, 'slice4-env-migration.test.ts')];

describe('REQ-S4-01 — Environment Variable Migration', () => {
  it('should have zero import.meta.env.VITE_ references in src/', () => {
    const files = collectSourceFiles(SRC_DIR).filter(f => !EXEMPT_FILES.includes(f));
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('import.meta.env.VITE_')) {
          violations.push(`${file}:${idx + 1}: ${line.trim()}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });

  it('should have zero import.meta.env.VITE_ references in app/', () => {
    const files = collectSourceFiles(APP_DIR).filter(f => !EXEMPT_FILES.includes(f));
    const violations: string[] = [];

    for (const file of files) {
      const content = readFileSync(file, 'utf-8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('import.meta.env.VITE_')) {
          violations.push(`${file}:${idx + 1}: ${line.trim()}`);
        }
      });
    }

    expect(violations).toEqual([]);
  });
});

describe('REQ-S4-01 — NEXT_PUBLIC_* usage in services', () => {
  it('should use process.env.NEXT_PUBLIC_API_URL in src/lib/api.ts', () => {
    const content = readFileSync(join(SRC_DIR, 'lib', 'api.ts'), 'utf-8');
    expect(content).toContain('process.env.NEXT_PUBLIC_API_URL');
    expect(content).not.toContain('import.meta.env');
  });

  it('should use process.env.NEXT_PUBLIC_API_URL in src/services/ApiClient.ts', () => {
    const content = readFileSync(join(SRC_DIR, 'services', 'ApiClient.ts'), 'utf-8');
    expect(content).toContain('process.env.NEXT_PUBLIC_API_URL');
    expect(content).not.toContain('import.meta.env');
  });

  it('should use process.env.NEXT_PUBLIC_GEMINI_API_KEY in ChatService.ts', () => {
    const content = readFileSync(join(SRC_DIR, 'services', 'ChatService.ts'), 'utf-8');
    expect(content).toContain('process.env.NEXT_PUBLIC_GEMINI_API_KEY');
    expect(content).not.toContain('import.meta.env');
  });

  it('should use process.env.NEXT_PUBLIC_* in phase3-integration.ts', () => {
    const content = readFileSync(join(SRC_DIR, 'services', 'phase3-integration.ts'), 'utf-8');
    expect(content).toContain('process.env.NEXT_PUBLIC_GEMINI_API_KEY');
    expect(content).toContain('process.env.NEXT_PUBLIC_CERTIFICATE_ISSUER_NAME');
    expect(content).toContain('process.env.NEXT_PUBLIC_PWA_ENABLED');
    expect(content).not.toContain('import.meta.env');
  });

  it('should use process.env.NEXT_PUBLIC_API_URL in MSMApiClient.ts', () => {
    const content = readFileSync(join(SRC_DIR, 'services', 'MSMApiClient.ts'), 'utf-8');
    expect(content).toContain('process.env.NEXT_PUBLIC_API_URL');
    expect(content).not.toContain('import.meta.env');
  });

  it('should use process.env.NEXT_PUBLIC_SUPABASE_* in supabase client', () => {
    const content = readFileSync(join(SRC_DIR, 'integrations', 'supabase', 'client.ts'), 'utf-8');
    expect(content).toContain('process.env.NEXT_PUBLIC_SUPABASE_URL');
    expect(content).toContain('process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
    expect(content).not.toContain('import.meta.env');
  });
});

describe('REQ-S4-02 — Vitest config', () => {
  it('should resolve @/ alias to project root', () => {
    const content = readFileSync(join(ROOT, 'vitest.config.ts'), 'utf-8');
    // The alias should map @ to the project root (.), not ./src
    expect(content).toContain('@');
  });
});

describe('REQ-S4-03 — Cypress config', () => {
  it('should use port 8080 for baseUrl', () => {
    const content = readFileSync(join(ROOT, 'cypress.config.ts'), 'utf-8');
    expect(content).toContain('localhost:8080');
  });
});
