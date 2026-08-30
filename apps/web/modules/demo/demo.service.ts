import "server-only"

import { randomUUID } from "node:crypto"

import { Resend } from "resend"
import { prisma } from "@workspace/database"
import { articleLimitForCadence, brandingLabel } from "@workspace/shared/cadence"
import { DEFAULT_TOPIC_WEIGHT, TOPICS } from "@workspace/shared/topics"

import { storeDel, storeGet, storeSet } from "@/lib/ttl-store"
import { rankArticlesForTopicSlugs } from "@/modules/recommendation/recommendation.service"
import { buildIntro, buildSubject } from "@/modules/newsletter/newsletter.copy"
import {
  renderNewsletterHtml,
  type NewsletterArticleView,
} from "@/modules/newsletter/newsletter.generator"
import { sendMagicLinkEmail } from "@/modules/auth/email"
import { createMagicLinkToken } from "@/modules/auth/tokens"
import {
  countActivePreferences,
  replaceUserPreferences,
} from "@/modules/preferences/preferences.service"

import type { DemoPreview, DemoPreviewArticle } from "./types"

const DEMO_CADENCE = "WEEKLY" as const
const PREVIEW_TTL_SECONDS = 30 * 60
const TOPICS_TTL_SECONDS = 30 * 60

function previewKey(id: string): string {
  return `demo:preview:${id}`
}

function topicsKey(email: string): string {
  return `demo:topics:${email.toLowerCase()}`
}

export async function previewNewsletterForTopics(
  slugs: string[]
): Promise<DemoPreview | null> {
  const limit = articleLimitForCadence(DEMO_CADENCE)
  const ranked = await rankArticlesForTopicSlugs(slugs, {
    limit,
    cadence: DEMO_CADENCE,
  })
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
  const byId = new Map(articles.map((article) => [article.id, article]))

  const topicCounts = new Map<string, number>()
  for (const r of ranked) {
    if (r.topTopic) {
      topicCounts.set(r.topTopic, (topicCounts.get(r.topTopic) ?? 0) + 1)
    }
  }
  const trendingTopic =
    [...topicCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const slugSet = new Set(slugs)
  const topicNames = TOPICS.filter((topic) => slugSet.has(topic.slug)).map(
    (topic) => topic.name
  )

  const views: DemoPreviewArticle[] = ranked.flatMap((r) => {
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
        url: article.url,
      },
    ]
  })

  if (views.length === 0) return null

  const preview: DemoPreview = {
    previewId: randomUUID(),
    topicSlugs: slugs,
    subject: buildSubject(trendingTopic),
    intro: buildIntro(views.length, trendingTopic, DEMO_CADENCE),
    trendingTopic,
    topicNames,
    articles: views,
  }

  await storeSet(previewKey(preview.previewId), preview, PREVIEW_TTL_SECONDS)
  return preview
}

export async function getStoredPreview(
  previewId: string
): Promise<DemoPreview | null> {
  return storeGet<DemoPreview>(previewKey(previewId))
}

function toTemplateArticles(
  articles: DemoPreviewArticle[]
): NewsletterArticleView[] {
  return articles.map((article) => ({
    title: article.title,
    summary: article.summary,
    reason: article.reason,
    sourceName: article.sourceName,
    readingTimeMin: article.readingTimeMin,
    topics: article.topics,
    trackedUrl: article.url,
  }))
}

export async function sendDemoEdition(
  email: string,
  preview: DemoPreview
): Promise<void> {
  const html = renderNewsletterHtml({
    subject: preview.subject,
    intro: preview.intro,
    articles: toTemplateArticles(preview.articles),
    trendingTopic: preview.trendingTopic,
    toolOfTheWeek: null,
    branding: brandingLabel(DEMO_CADENCE),
    openPixelUrl: "",
    unsubscribeUrl: "",
    recipientEmail: email,
    sample: true,
  })

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn(
      `[demo] RESEND_API_KEY not set. Skipping sample send to ${email} (${preview.subject}).`
    )
    return
  }

  const resend = new Resend(apiKey)
  const from = process.env.EMAIL_FROM ?? "Astra <onboarding@caldasdev.com.br>"
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: `[Sample] ${preview.subject}`,
    html,
  })
  if (error) {
    console.error("[demo] Failed to send sample edition", error)
    throw new Error("Failed to send sample edition")
  }
}

export async function requestDemoSubscription(
  email: string,
  topicSlugs: string[]
): Promise<void> {
  await storeSet(topicsKey(email), topicSlugs, TOPICS_TTL_SECONDS)
  const rawToken = await createMagicLinkToken(email)
  await sendMagicLinkEmail(email, rawToken)
}

export async function applyStashedDemoTopics(userId: string, email: string) {
  const slugs = await storeGet<string[]>(topicsKey(email))
  if (!slugs || slugs.length === 0) return

  const existing = await countActivePreferences(userId)
  if (existing > 0) return

  const topics = await prisma.topic.findMany({
    where: { slug: { in: slugs } },
    select: { id: true },
  })
  if (topics.length === 0) return

  await replaceUserPreferences(
    userId,
    topics.map((topic) => ({
      topicId: topic.id,
      weight: DEFAULT_TOPIC_WEIGHT,
    }))
  )
  await storeDel(topicsKey(email))
}
