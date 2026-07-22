import { describe, expect, it } from 'vitest';
import {
  getScoreBarColor,
  getScoreBg,
  getScoreText,
} from '../score-colors';

describe('score-colors — traffic-light semantics', () => {
  describe('getScoreText (text color class)', () => {
    it('returns green for score ≥ 85', () => {
      expect(getScoreText(85)).toContain('green');
      expect(getScoreText(100)).toContain('green');
    });

    it('returns amber/yellow for score 70–84', () => {
      expect(getScoreText(70)).toContain('amber');
      expect(getScoreText(77)).toContain('amber');
      expect(getScoreText(84)).toContain('amber');
    });

    it('returns red for score < 70', () => {
      expect(getScoreText(69)).toContain('red');
      expect(getScoreText(0)).toContain('red');
    });
  });

  describe('getScoreBarColor (progress bar fill class)', () => {
    it('returns green for score ≥ 85', () => {
      expect(getScoreBarColor(85)).toContain('green');
      expect(getScoreBarColor(95)).toContain('green');
    });

    it('returns amber for score 70–84', () => {
      expect(getScoreBarColor(70)).toContain('amber');
      expect(getScoreBarColor(80)).toContain('amber');
    });

    it('returns red for score < 70', () => {
      expect(getScoreBarColor(69)).toContain('red');
      expect(getScoreBarColor(10)).toContain('red');
    });
  });

  describe('getScoreBg (background/border class)', () => {
    it('returns green bg for score ≥ 85', () => {
      expect(getScoreBg(85)).toContain('green');
      expect(getScoreBg(100)).toContain('green');
    });

    it('returns amber bg for score 70–84', () => {
      expect(getScoreBg(70)).toContain('amber');
      expect(getScoreBg(77)).toContain('amber');
    });

    it('returns red bg for score < 70', () => {
      expect(getScoreBg(69)).toContain('red');
      expect(getScoreBg(0)).toContain('red');
    });
  });

  describe('boundary conditions', () => {
    it('85 is green, 84 is amber (boundary at 85)', () => {
      expect(getScoreText(85)).toContain('green');
      expect(getScoreText(84)).toContain('amber');
    });

    it('70 is amber, 69 is red (boundary at 70)', () => {
      expect(getScoreText(70)).toContain('amber');
      expect(getScoreText(69)).toContain('red');
    });

    it('fractional scores round correctly at boundaries', () => {
      // 84.9 is still amber (< 85)
      expect(getScoreBarColor(84.9)).toContain('amber');
      // 70.1 is still amber (>= 70)
      expect(getScoreBg(70.1)).toContain('amber');
      // 69.9 is red (< 70)
      expect(getScoreText(69.9)).toContain('red');
    });
  });
});
