export const NEWSLETTER_CADENCES = ["DAILY", "WEEKLY"] as const

export type NewsletterCadence = (typeof NEWSLETTER_CADENCES)[number]

/** Default article count for each cadence. Daily is clamped 3–5 elsewhere. */
export const CADENCE_ARTICLE_LIMIT: Record<NewsletterCadence, number> = {
  DAILY: 4,
  WEEKLY: 8,
}

export const MIN_DAILY_ARTICLES = 3
export const MAX_DAILY_ARTICLES = 5

export const DEFAULT_SEND_HOUR = 8
export const DEFAULT_TIMEZONE = "America/Sao_Paulo"
export const DEFAULT_WEEKLY_SEND_DAY = 1 // Monday
export const DEFAULT_DAILY_ENABLED = false
export const DEFAULT_WEEKLY_ENABLED = true
export const DEFAULT_DAILY_SEND_DAYS = [0, 1, 2, 3, 4, 5, 6] as const

/** Slightly higher diversity penalty for short digests. */
export const DIVERSITY_PENALTY_BY_CADENCE: Record<NewsletterCadence, number> = {
  DAILY: 0.2,
  WEEKLY: 0.15,
}

export function articleLimitForCadence(cadence: NewsletterCadence): number {
  if (cadence === "DAILY") {
    return Math.min(
      MAX_DAILY_ARTICLES,
      Math.max(MIN_DAILY_ARTICLES, CADENCE_ARTICLE_LIMIT.DAILY)
    )
  }
  return CADENCE_ARTICLE_LIMIT.WEEKLY
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

/** Common IANA timezones offered in the preferences UI. */
export const COMMON_TIMEZONES = [
  "America/Sao_Paulo",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/Buenos_Aires",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Australia/Sydney",
  "UTC",
] as const
