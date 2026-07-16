import "server-only"

import { Resend } from "resend"

import { prisma } from "@workspace/database"
import {
  articleLimitForCadence,
  brandingLabel,
  type NewsletterCadence,
} from "@workspace/shared/cadence"
import { BRAND_NAME, BRAND_PRODUCT } from "@workspace/shared/branding"
import { DOMAIN_EVENTS } from "@workspace/shared/events"

import { dispatchEvent } from "@/lib/events"
import { rankArticlesForUser } from "@/modules/recommendation/recommendation.service"
import {
  renderNewsletterHtml,
  type NewsletterArticleView,
} from "./newsletter.generator"

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}

function buildSubject(trending: string | null): string {
  const date = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
  return trending
    ? `Your ${trending} briefing — ${date}`
    : `Your ${BRAND_NAME} briefing — ${date}`
}

/**
 * Generate (but do not send) a personalized newsletter for a user. Returns the
 * created newsletter id, or null when there are no suitable articles.
 */
export async function generateNewsletterForUser(
  userId: string
): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, cadence: true },
  })
  if (!user) return null

  const cadence = user.cadence as NewsletterCadence
  const limit = articleLimitForCadence(cadence)
  const ranked = await rankArticlesForUser(userId, { limit, cadence })
  if (ranked.length === 0) return null

  const ids = ranked.map((r) => r.articleId)
  const articles = await prisma.article.findMany({
    where: { id: { in: ids } },
    select: {
      id: true,
      title: true,
      summary: true,
      url: true,
      readingTimeMin: true,
      source: { select: { name: true } },
      topics: { select: { topic: { select: { name: true } } } },
    },
  })
  const byId = new Map(articles.map((a) => [a.id, a]))

  const topicCounts = new Map<string, number>()
  for (const r of ranked) {
    if (r.topTopic) {
      topicCounts.set(r.topTopic, (topicCounts.get(r.topTopic) ?? 0) + 1)
    }
  }
  const trendingTopic =
    [...topicCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const subject = buildSubject(trendingTopic)
  const periodWord = cadence === "DAILY" ? "today" : "this week"
  const intro = `We curated ${ranked.length} stories tuned to your interests${
    trendingTopic ? `, with extra signal on ${trendingTopic}` : ""
  }. Here is what matters most ${periodWord}.`

  const newsletter = await prisma.newsletter.create({
    data: {
      userId,
      subject,
      intro,
      status: "GENERATING",
      cadence,
    },
  })

  const trackedUrlFor = (articleId: string) =>
    `${appUrl()}/api/track/click?n=${newsletter.id}&a=${articleId}`

  await prisma.newsletterArticle.createMany({
    data: ranked.map((r, index) => ({
      newsletterId: newsletter.id,
      articleId: r.articleId,
      rank: index + 1,
      reason: r.reason,
      trackedUrl: trackedUrlFor(r.articleId),
    })),
    skipDuplicates: true,
  })

  const views: NewsletterArticleView[] = ranked.flatMap((r) => {
    const article = byId.get(r.articleId)
    if (!article) return []
    return [
      {
        title: article.title,
        summary: article.summary,
        reason: r.reason,
        sourceName: article.source?.name ?? null,
        readingTimeMin: article.readingTimeMin,
        topics: article.topics.map((t) => t.topic.name),
        trackedUrl: trackedUrlFor(article.id),
      },
    ]
  })

  const toolOfTheWeek =
    views.find((v) => v.topics.includes("Developer Tools")) ?? views[0] ?? null

  const html = renderNewsletterHtml({
    subject,
    intro,
    articles: views,
    trendingTopic,
    toolOfTheWeek,
    branding: brandingLabel(cadence),
    openPixelUrl: `${appUrl()}/api/track/open?n=${newsletter.id}`,
    unsubscribeUrl: `${appUrl()}/preferences`,
    recipientEmail: user.email,
  })

  await prisma.newsletter.update({
    where: { id: newsletter.id },
    data: { htmlContent: html, status: "READY" },
  })

  dispatchEvent(DOMAIN_EVENTS.NewsletterCreated, {
    newsletterId: newsletter.id,
    userId,
  })

  return newsletter.id
}

/** Send a previously generated newsletter via Resend and mark it as sent. */
export async function sendNewsletter(newsletterId: string): Promise<void> {
  const newsletter = await prisma.newsletter.findUnique({
    where: { id: newsletterId },
    include: { user: { select: { email: true } } },
  })

  if (!newsletter || !newsletter.htmlContent) {
    throw new Error("Newsletter is not ready to send")
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn(
      `[newsletter] RESEND_API_KEY not set. Skipping send for ${newsletterId}.`
    )
  } else {
    const resend = new Resend(apiKey)
    const from =
      process.env.EMAIL_FROM ?? `${BRAND_PRODUCT} <onboarding@resend.dev>`
    const { error } = await resend.emails.send({
      from,
      to: newsletter.user.email,
      subject: newsletter.subject,
      html: newsletter.htmlContent,
    })
    if (error) {
      await prisma.newsletter.update({
        where: { id: newsletterId },
        data: { status: "FAILED" },
      })
      throw new Error("Failed to send newsletter")
    }
  }

  await prisma.newsletter.update({
    where: { id: newsletterId },
    data: { status: "SENT", sentAt: new Date() },
  })

  dispatchEvent(DOMAIN_EVENTS.NewsletterSent, {
    newsletterId,
    userId: newsletter.userId,
  })
}
