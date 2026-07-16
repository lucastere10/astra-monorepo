/**
 * Pure scoring primitives shared between the web app and (conceptually) the
 * worker. The recommendation engine combines several signals rather than
 * relying on a single LLM prompt.
 */

export interface ScoreSignals {
  /** Editorial / global quality score of the article, 0..1. */
  globalScore: number
  /** How well the article matches the user's weighted topics, 0..1. */
  topicAffinity: number
  /** Engagement signal derived from the user's past interactions, 0..1. */
  interactionScore: number
  /** Recency signal, 0..1 (1 = brand new). */
  freshnessScore: number
  /** Diversity bonus to avoid clustering similar items, 0..1. */
  diversityBonus: number
}

export const SCORE_WEIGHTS: Record<keyof ScoreSignals, number> = {
  globalScore: 0.3,
  topicAffinity: 0.3,
  interactionScore: 0.2,
  freshnessScore: 0.1,
  diversityBonus: 0.1,
}

export function clamp01(value: number): number {
  if (Number.isNaN(value)) return 0
  return Math.min(1, Math.max(0, value))
}

export function computeRankScore(signals: ScoreSignals): number {
  return (
    clamp01(signals.globalScore) * SCORE_WEIGHTS.globalScore +
    clamp01(signals.topicAffinity) * SCORE_WEIGHTS.topicAffinity +
    clamp01(signals.interactionScore) * SCORE_WEIGHTS.interactionScore +
    clamp01(signals.freshnessScore) * SCORE_WEIGHTS.freshnessScore +
    clamp01(signals.diversityBonus) * SCORE_WEIGHTS.diversityBonus
  )
}

/**
 * Exponential time-decay freshness. `halfLifeHours` controls how quickly an
 * article's freshness signal halves.
 */
export function freshnessScore(
  publishedAt: Date | null | undefined,
  now: Date = new Date(),
  halfLifeHours = 48
): number {
  if (!publishedAt) return 0
  const ageHours = (now.getTime() - publishedAt.getTime()) / 3_600_000
  if (ageHours <= 0) return 1
  return clamp01(Math.pow(0.5, ageHours / halfLifeHours))
}
