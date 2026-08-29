export const NEWSLETTER_CADENCES = ["DAILY", "WEEKLY"] as const

export type NewsletterCadence = (typeof NEWSLETTER_CADENCES)[number]

/** Default article count for each cadence. */
export const CADENCE_ARTICLE_LIMIT: Record<NewsletterCadence, number> = {
  DAILY: 6,
  WEEKLY: 10,
}

export const DEFAULT_SEND_HOUR = 8
export const DEFAULT_TIMEZONE = "America/Sao_Paulo"
export const DEFAULT_WEEKLY_SEND_DAY = 1 // Monday
export const DEFAULT_DAILY_ENABLED = false
export const DEFAULT_WEEKLY_ENABLED = true
export const DEFAULT_DAILY_SEND_DAYS = [0, 1, 2, 3, 4, 5, 6] as const

/** Standard delivery windows — keep the deliver scheduler aligned with these hours. */
export const SEND_HOUR_PRESETS = [8, 12, 18] as const
export type SendHourPreset = (typeof SEND_HOUR_PRESETS)[number]

export function isSendHourPreset(hour: number): hour is SendHourPreset {
  return (SEND_HOUR_PRESETS as readonly number[]).includes(hour)
}

/** Snap any hour to the nearest standard send window. */
export function nearestSendHourPreset(hour: number): SendHourPreset {
  let best: SendHourPreset = SEND_HOUR_PRESETS[0]
  let bestDist = Infinity
  for (const preset of SEND_HOUR_PRESETS) {
    const dist = Math.min(
      Math.abs(hour - preset),
      24 - Math.abs(hour - preset)
    )
    if (dist < bestDist) {
      best = preset
      bestDist = dist
    }
  }
  return best
}

/** Slightly higher diversity penalty for short digests. */
export const DIVERSITY_PENALTY_BY_CADENCE: Record<NewsletterCadence, number> = {
  DAILY: 0.2,
  WEEKLY: 0.15,
}

/** Max articles from the same source family in one digest. */
export const SOURCE_FAMILY_CAP_BY_CADENCE: Record<NewsletterCadence, number> = {
  DAILY: 1,
  WEEKLY: 2,
}

export function articleLimitForCadence(cadence: NewsletterCadence): number {
  return CADENCE_ARTICLE_LIMIT[cadence]
}

/** Prefer weekly when both (or neither) are enabled — richer on-demand edition. */
export function inferCadenceForGenerate(options: {
  weeklyEnabled: boolean
  dailyEnabled: boolean
}): NewsletterCadence {
  if (options.weeklyEnabled) return "WEEKLY"
  if (options.dailyEnabled) return "DAILY"
  return "WEEKLY"
}

export { brandingLabel } from "./branding"

export const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const

/** Supported delivery timezone (single-region for now). */
export const COMMON_TIMEZONES = [DEFAULT_TIMEZONE] as const
