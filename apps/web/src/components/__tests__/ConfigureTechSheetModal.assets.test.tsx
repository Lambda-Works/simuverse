import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const EMOJI_REGEX =
  /[\u{1F300}-\u{1F9FF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F000}-\u{1FFFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;

function getEmojiMatches(content: string): { emoji: string; line: number; context: string }[] {
  const lines = content.split('\n');
  const matches: { emoji: string; line: number; context: string }[] = [];

  lines.forEach((line, idx) => {
    const lineMatches = line.match(EMOJI_REGEX);
    if (lineMatches) {
      for (const emoji of lineMatches) {
        matches.push({
          emoji,
          line: idx + 1,
          context: line.trim().substring(0, 80),
        });
      }
    }
  });

  return matches;
}

describe('ConfigureTechSheetModal — Assets tab', () => {
  it('should contain zero emoji characters', () => {
    const filePath = resolve(__dirname, '..', 'ConfigureTechSheetModal.tsx');
    const content = readFileSync(filePath, 'utf-8');
    const matches = getEmojiMatches(content);

    if (matches.length > 0) {
      const details = matches
        .map((m) => `  line ${m.line}: ${m.emoji} → ${m.context}`)
        .join('\n');
      throw new Error(
        `Found ${matches.length} emoji(s) in ConfigureTechSheetModal.tsx:\n${details}`
      );
    }

    expect(matches).toHaveLength(0);
  });

  it('should have "assets" tab trigger in TabsList', () => {
    const filePath = resolve(__dirname, '..', 'ConfigureTechSheetModal.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/TabsTrigger[^>]*value="assets"/);
  });

  it('should have EmailsSection component or inline email editing', () => {
    const filePath = resolve(__dirname, '..', 'ConfigureTechSheetModal.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/EmailsSection|step_8_emails|emails.*editable/i);
  });

  it('should have SpreadsheetSection component or inline spreadsheet editing', () => {
    const filePath = resolve(__dirname, '..', 'ConfigureTechSheetModal.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/SpreadsheetSection|step_9_spreadsheet|spreadsheet.*editable/i);
  });

  it('should have CrisisSection component or inline crisis editing', () => {
    const filePath = resolve(__dirname, '..', 'ConfigureTechSheetModal.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/CrisisSection|step_10_crisis|crisis.*editable/i);
  });

  it('should import Mail, BarChart3, ShieldAlert from lucide-react', () => {
    const filePath = resolve(__dirname, '..', 'ConfigureTechSheetModal.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/import\s*\{[^}]*Mail[^}]*\}\s*from\s*['"]lucide-react['"]/);
    expect(content).toMatch(/import\s*\{[^}]*BarChart3[^}]*\}\s*from\s*['"]lucide-react['"]/);
    expect(content).toMatch(/import\s*\{[^}]*ShieldAlert[^}]*\}\s*from\s*['"]lucide-react['"]/);
  });
});
