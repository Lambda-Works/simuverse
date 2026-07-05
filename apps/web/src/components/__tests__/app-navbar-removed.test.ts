import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';
import path from 'path';

const WEB_SRC = path.resolve(__dirname, '../../..');

describe('AppNavbar fully removed', () => {
  it('has zero imports of AppNavbar across all source files', () => {
    let output = '';
    try {
      output = execSync('rg "AppNavbar" -g "*.tsx" -g "*.ts" -g "*.jsx" -g "*.js"', {
        cwd: WEB_SRC,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (err: any) {
      // rg exits with code 1 when no matches found — that's the expected case
      if (err.status === 1) {
        // No matches — test passes
        expect(true).toBe(true);
        return;
      }
      throw err;
    }

    // If we get here, rg found matches — that means AppNavbar still exists
    expect(output).toBe('');
  });

  it('AppNavbar.tsx file does not exist', () => {
    const fs = require('fs');
    const navbarPath = path.join(WEB_SRC, 'src/components/AppNavbar.tsx');
    expect(fs.existsSync(navbarPath)).toBe(false);
  });
});
