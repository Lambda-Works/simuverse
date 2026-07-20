import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const FILES = [
  'EndorsersABM.tsx',
  'CompaniesABM.tsx',
  'FoundationABM.tsx',
  'RolesABM.tsx',
];

// Emoji Unicode ranges — covers all common emoji blocks
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

describe('ABM files — no emoji characters in JSX', () => {
  for (const file of FILES) {
    it(`${file} should contain zero emoji characters`, () => {
      const filePath = resolve(__dirname, '..', file);
      const content = readFileSync(filePath, 'utf-8');
      const matches = getEmojiMatches(content);

      if (matches.length > 0) {
        const details = matches
          .map((m) => `  line ${m.line}: ${m.emoji} → ${m.context}`)
          .join('\n');
        throw new Error(
          `Found ${matches.length} emoji(s) in ${file}:\n${details}`
        );
      }

      expect(matches).toHaveLength(0);
    });
  }
});

describe('ABM files — Lucide icons import from lucide-react', () => {
  it('EndorsersABM imports Handshake from lucide-react', () => {
    const filePath = resolve(__dirname, '..', 'EndorsersABM.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/import\s*\{[^}]*Handshake[^}]*\}\s*from\s*['"]lucide-react['"]/);
  });

  it('CompaniesABM imports Building2 from lucide-react', () => {
    const filePath = resolve(__dirname, '..', 'CompaniesABM.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/import\s*\{[^}]*Building2[^}]*\}\s*from\s*['"]lucide-react['"]/);
  });

  it('FoundationABM imports GraduationCap from lucide-react', () => {
    const filePath = resolve(__dirname, '..', 'FoundationABM.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/import\s*\{[^}]*GraduationCap[^}]*\}\s*from\s*['"]lucide-react['"]/);
  });

  it('RolesABM imports Shield from lucide-react', () => {
    const filePath = resolve(__dirname, '..', 'RolesABM.tsx');
    const content = readFileSync(filePath, 'utf-8');
    expect(content).toMatch(/import\s*\{[^}]*Shield[^}]*\}\s*from\s*['"]lucide-react['"]/);
  });
});
