import "server-only"

import OpenAI from "openai"
import { z } from "zod"

import type { NewsletterCadence } from "@workspace/shared/cadence"

import { createChatCompletion } from "@/lib/openai-chat"
import { buildIntro, buildReason } from "./newsletter.copy"

export interface VoiceArticle {
  id: string
  title: string
  summary: string | null
  topic: string | null
  fallbackReason: string
}

export interface NewsletterVoiceCopy {
  intro: string
  reasons: Record<string, string>
}

const voiceSchema = z.object({
  intro: z.string().min(1),
  reasons: z.record(z.string(), z.string()).optional(),
})

function fallbackCopy(
  cadence: NewsletterCadence,
  trendingTopic: string | null,
  articles: VoiceArticle[]
): NewsletterVoiceCopy {
  const reasons: Record<string, string> = {}
  for (const article of articles) {
    reasons[article.id] = article.fallbackReason || buildReason(article.topic, 0)
  }
  return {
    intro: buildIntro(articles.length, trendingTopic, cadence),
    reasons,
  }
}

function mergeReasons(
  articles: VoiceArticle[],
  generated: Record<string, string> | undefined
): Record<string, string> {
  const reasons: Record<string, string> = {}
  const generatedMap = generated ?? {}
  for (const article of articles) {
    const line = generatedMap[article.id]?.trim()
    reasons[article.id] =
      line && line.length > 0
        ? line
        : article.fallbackReason || buildReason(article.topic, 0)
  }
  return reasons
}

/**
 * Write intro + per-article "Why it matters" for a finished ranking.
 * Falls back to templates when the API key is missing or the call fails.
 */
export async function writeNewsletterCopy(options: {
  cadence: NewsletterCadence
  trendingTopic: string | null
  articles: VoiceArticle[]
}): Promise<NewsletterVoiceCopy> {
  const { cadence, trendingTopic, articles } = options
  const fallback = fallbackCopy(cadence, trendingTopic, articles)
  if (articles.length === 0) return fallback

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return fallback

  const periodWord = cadence === "DAILY" ? "today" : "this week"
  const catalog = articles.map((article) => ({
    id: article.id,
    title: article.title,
    summary: article.summary,
    topic: article.topic,
  }))

  const prompt = [
    "You write a short technology newsletter in English.",
    "Return strict JSON with keys: intro (string), reasons (object mapping article id to string).",
    `intro: 1–2 sentences about the actual mix of stories below. Use "${periodWord}". Do not list every title. Do not repeat a subject line. Do not say "curated for you" or "tuned to your interests".`,
    trendingTopic ? `A recurring thread is ${trendingTopic}.` : "",
    'reasons: one sentence per article, 12–20 words, specific to that story. No "your interest in", "highly relevant", "curated for you", or "selected for quality".',
    "",
    `ARTICLES: ${JSON.stringify(catalog)}`,
  ]
    .filter(Boolean)
    .join("\n")

  try {
    const client = new OpenAI({ apiKey })
    const completion = await createChatCompletion(client, {
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.5,
    })
    const payload = JSON.parse(completion.choices[0]?.message?.content || "{}")
    const parsed = voiceSchema.safeParse(payload)
    if (!parsed.success) return fallback
    return {
      intro: parsed.data.intro.trim(),
      reasons: mergeReasons(articles, parsed.data.reasons),
    }
  } catch (error) {
    console.warn("[newsletter.voice] OpenAI copy failed, using templates:", error)
    return fallback
  }
}
