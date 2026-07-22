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

describe('TechSheetsABM — after refactoring', () => {
  it('should contain zero emoji characters', () => {
    const filePath = resolve(__dirname, '..', 'TechSheetsABM.tsx');
    const content = readFileSync(filePath, 'utf-8');
    const matches = getEmojiMatches(content);

    if (matches.length > 0) {
      const details = matches
        .map((m) => `  line ${m.line}: ${m.emoji} → ${m.context}`)
        .join('\n');
      throw new Error(
        `Found ${matches.length} emoji(s) in TechSheetsABM.tsx:\n${details}`
      );
    }

    expect(matches).toHaveLength(0);
  });

  it('should import TechSheetCard from ./TechSheetCard', () => {
    const filePath = resolve(__dirname, '..', 'TechSheetsABM.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/import\s*\{[^}]*TechSheetCard[^}]*\}\s*from\s*['"]\.\/TechSheetCard['"]/);
  });

  it('should import TechSheetForm from ./TechSheetForm', () => {
    const filePath = resolve(__dirname, '..', 'TechSheetsABM.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/import\s*\{[^}]*TechSheetForm[^}]*\}\s*from\s*['"]\.\/TechSheetForm['"]/);
  });

  it('should have line count <= 400 (monolith decomposed)', () => {
    const filePath = resolve(__dirname, '..', 'TechSheetsABM.tsx');
    const content = readFileSync(filePath, 'utf-8');
    const lineCount = content.split('\n').length;
    expect(lineCount).toBeLessThanOrEqual(400);
  });

  it('sub-components should each be <= 300 lines', () => {
    const components = [
      'TechSheetCard.tsx',
      'TechSheetForm.tsx',
      'PipelineStatus.tsx',
      'CompetencyEditor.tsx',
      'KpiEditor.tsx',
    ];

    for (const comp of components) {
      const filePath = resolve(__dirname, '..', comp);
      const content = readFileSync(filePath, 'utf-8');
      const lineCount = content.split('\n').length;
      expect(lineCount).toBeLessThanOrEqual(300);
    }
  });
});
