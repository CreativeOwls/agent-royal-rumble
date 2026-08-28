import type { Weights } from "./types";

/** Min-max normalise to 0..100. `higherIsBetter=false` inverts (lower raw wins). */
export function normalize(values: number[], higherIsBetter: boolean): number[] {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return values.map(() => 0);
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  if (max === min) return values.map((v) => (Number.isFinite(v) ? 100 : 0));
  return values.map((v) => {
    if (!Number.isFinite(v)) return 0;
    const t = (v - min) / (max - min);
    return Math.round((higherIsBetter ? t : 1 - t) * 100);
  });
}

/**
 * Efficiency raw cost: wall-clock seconds blended with output tokens spent.
 * Lower is better; both terms are measured, never guessed.
 */
export function efficiencyRaw(latencyMs: number, completionTokens: number): number {
  return (latencyMs / 1000) * 0.6 + (completionTokens / 100) * 0.4;
}

export function overallScore(
  scores: { quality: number; result: number; efficiency: number; cost: number },
  weights: Weights,
): number {
  const total = weights.quality + weights.result + weights.efficiency + weights.cost;
  if (total <= 0) return 0;
  const sum =
    scores.quality * weights.quality +
    scores.result * weights.result +
    scores.efficiency * weights.efficiency +
    scores.cost * weights.cost;
  return Math.round((sum / total) * 10) / 10;
}
