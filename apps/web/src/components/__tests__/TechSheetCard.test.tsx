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

describe('TechSheetCard', () => {
  it('should contain zero emoji characters', () => {
    const filePath = resolve(__dirname, '..', 'TechSheetCard.tsx');
    const content = readFileSync(filePath, 'utf-8');
    const matches = getEmojiMatches(content);

    if (matches.length > 0) {
      const details = matches
        .map((m) => `  line ${m.line}: ${m.emoji} → ${m.context}`)
        .join('\n');
      throw new Error(
        `Found ${matches.length} emoji(s) in TechSheetCard.tsx:\n${details}`
      );
    }

    expect(matches).toHaveLength(0);
  });

  it('should import Lucide icons FileText, AlertTriangle from lucide-react', () => {
    const filePath = resolve(__dirname, '..', 'TechSheetCard.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/import\s*\{[^}]*FileText[^}]*\}\s*from\s*['"]lucide-react['"]/);
    expect(content).toMatch(/import\s*\{[^}]*AlertTriangle[^}]*\}\s*from\s*['"]lucide-react['"]/);
  });

  it('should accept TechSheet prop interface with required fields', () => {
    const filePath = resolve(__dirname, '..', 'TechSheetCard.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/interface\s+TechSheet/);
    expect(content).toMatch(/id:\s*number/);
    expect(content).toMatch(/name:\s*string/);
  });

  it('should export TechSheetCard component', () => {
    const filePath = resolve(__dirname, '..', 'TechSheetCard.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/export\s+(function|const)\s+TechSheetCard/);
  });
});
