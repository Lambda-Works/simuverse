/**
 * score-colors.ts — Shared traffic-light color tokens for score indicators.
 *
 * Thresholds:
 *   green  ≥ 85
 *   amber  70–84
 *   red    < 70
 */

/** Text color class for a score value. */
export function getScoreText(s: number): string {
  return s >= 85 ? 'text-green-600' : s >= 70 ? 'text-amber-600' : 'text-red-600';
}

/** Progress-bar fill class for a score value. */
export function getScoreBarColor(s: number): string {
  return s >= 85 ? 'bg-green-500' : s >= 70 ? 'bg-amber-500' : 'bg-red-500';
}

/** Background + border class pair for a score card/badge. */
export function getScoreBg(s: number): string {
  return s >= 85
    ? 'bg-green-50 border-green-200'
    : s >= 70
      ? 'bg-amber-50 border-amber-200'
      : 'bg-red-50 border-red-200';
}
