import type { NewsletterCadence } from "./cadence"

/** Primary brand wordmark (UI, emails, digests). */
export const BRAND_NAME = "Astra"

/** Full product name (SEO, docs, EMAIL_FROM display). */
export const BRAND_PRODUCT = "Astra Newsletter"

export function brandingLabel(cadence: NewsletterCadence): string {
  return cadence === "DAILY" ? `${BRAND_NAME} Daily` : `${BRAND_NAME} Weekly`
}
