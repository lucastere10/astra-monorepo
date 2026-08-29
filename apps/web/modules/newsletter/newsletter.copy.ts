import { BRAND_NAME } from "@workspace/shared/branding"
import type { NewsletterCadence } from "@workspace/shared/cadence"

export function buildSubject(trending: string | null): string {
  const date = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
  return trending
    ? `Your ${trending} briefing — ${date}`
    : `Your ${BRAND_NAME} briefing — ${date}`
}

export function buildIntro(
  articleCount: number,
  trendingTopic: string | null,
  cadence: NewsletterCadence
): string {
  const periodWord = cadence === "DAILY" ? "today" : "this week"
  return `We curated ${articleCount} stories tuned to your interests${
    trendingTopic ? `, with extra signal on ${trendingTopic}` : ""
  }. Here is what matters most ${periodWord}.`
}

export function buildReason(topic: string | null, fresh: number): string {
  if (topic && fresh > 0.6) {
    return `Fresh and highly relevant to your interest in ${topic}.`
  }
  if (topic) {
    return `Matches your interest in ${topic}.`
  }
  if (fresh > 0.6) {
    return "A timely story trending across your sources."
  }
  return "Selected for its overall quality and relevance."
}
