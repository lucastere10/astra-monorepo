import "server-only"

import { prisma } from "@workspace/database"
import {
  DIVERSITY_PENALTY_BY_CADENCE,
  type NewsletterCadence,
} from "@workspace/shared/cadence"
import {
  clamp01,
  computeRankScore,
  freshnessScore,
} from "@workspace/shared/scoring"

import { cacheDel, cacheGet, cacheSet } from "@/lib/redis"

export interface RankedArticle {
  articleId: string
  title: string
  score: number
  topTopic: string | null
  reason: string
}

const CANDIDATE_LIMIT = 200
const INTERACTION_SAMPLE = 500
const CACHE_TTL_SECONDS = 300
const CACHEABLE_LIMITS = [4, 6, 8, 10, 12]

export interface RankOptions {
  limit?: number
  cadence?: NewsletterCadence
}

function recommendationKey(userId: string, limit: number): string {
  return `recs:${userId}:${limit}`
}

/** Invalidate cached rankings for a user (e.g. after preferences change). */
export async function invalidateUserRecommendations(
  userId: string
): Promise<void> {
  await Promise.all(
    CACHEABLE_LIMITS.map((limit) =>
      cacheDel(recommendationKey(userId, limit))
    )
  )
}

/**
 * Produce a personalized ranking of articles for a user. Combines several
 * signals (global quality, topic affinity, engagement, freshness) and applies
 * a diversity penalty greedily so a single topic cannot dominate the result.
 */
export async function rankArticlesForUser(
  userId: string,
  limitOrOptions: number | RankOptions = 8
): Promise<RankedArticle[]> {
  const options: RankOptions =
    typeof limitOrOptions === "number"
      ? { limit: limitOrOptions }
      : limitOrOptions
  const limit = options.limit ?? 8
  const diversityPenalty =
    DIVERSITY_PENALTY_BY_CADENCE[options.cadence ?? "WEEKLY"]

  const cacheKey = recommendationKey(userId, limit)
  const cached = await cacheGet<RankedArticle[]>(cacheKey)
  if (cached) return cached

  const [preferences, interactions, candidates] = await Promise.all([
    prisma.userPreference.findMany({
      where: { userId },
      select: { topicId: true, weight: true },
    }),
    prisma.userArticleInteraction.findMany({
      where: { userId },
      take: INTERACTION_SAMPLE,
      select: { article: { select: { topics: { select: { topicId: true } } } } },
    }),
    prisma.article.findMany({
      where: {
        OR: [
          { publishedAt: { gte: daysAgo(30) } },
          { publishedAt: null, createdAt: { gte: daysAgo(30) } },
        ],
      },
      orderBy: { globalScore: "desc" },
      take: CANDIDATE_LIMIT,
      select: {
        id: true,
        title: true,
        globalScore: true,
        publishedAt: true,
        duplicateCluster: true,
        topics: {
          select: {
            topicId: true,
            relevance: true,
            topic: { select: { name: true } },
          },
        },
      },
    }),
  ])

  const weightByTopic = new Map(preferences.map((p) => [p.topicId, p.weight]))
  const totalWeight = preferences.reduce((sum, p) => sum + p.weight, 0)

  const engagementByTopic = new Map<string, number>()
  for (const interaction of interactions) {
    for (const t of interaction.article.topics) {
      engagementByTopic.set(
        t.topicId,
        (engagementByTopic.get(t.topicId) ?? 0) + 1
      )
    }
  }
  const maxEngagement = Math.max(1, ...engagementByTopic.values())

  const now = new Date()

  const scored = candidates.map((article) => {
    let affinityNumerator = 0
    let engagementSum = 0
    let topTopic: { name: string; weight: number } | null = null

    for (const t of article.topics) {
      const weight = weightByTopic.get(t.topicId) ?? 0
      affinityNumerator += t.relevance * weight
      engagementSum += engagementByTopic.get(t.topicId) ?? 0

      if (weight > 0 && (!topTopic || weight > topTopic.weight)) {
        topTopic = { name: t.topic.name, weight }
      }
    }

    const topicAffinity =
      totalWeight > 0 ? clamp01(affinityNumerator / totalWeight) : 0
    const interactionScore = clamp01(
      engagementSum / (maxEngagement * Math.max(1, article.topics.length))
    )
    const fresh = freshnessScore(article.publishedAt, now)

    const baseScore = computeRankScore({
      globalScore: article.globalScore,
      topicAffinity,
      interactionScore,
      freshnessScore: fresh,
      diversityBonus: 0,
    })

    return {
      article,
      baseScore,
      topTopic,
      fresh,
      topicAffinity,
    }
  })

  scored.sort((a, b) => b.baseScore - a.baseScore)

  const selected: RankedArticle[] = []
  const seenClusters = new Set<string>()
  const topicUsage = new Map<string, number>()

  for (const item of scored) {
    if (selected.length >= limit) break

    if (item.article.duplicateCluster) {
      if (seenClusters.has(item.article.duplicateCluster)) continue
    }

    const primaryTopicId = item.article.topics[0]?.topicId
    const usage = primaryTopicId ? (topicUsage.get(primaryTopicId) ?? 0) : 0
    const adjustedScore = item.baseScore - usage * diversityPenalty

    selected.push({
      articleId: item.article.id,
      title: item.article.title,
      score: Number(adjustedScore.toFixed(4)),
      topTopic: item.topTopic?.name ?? null,
      reason: buildReason(item.topTopic?.name ?? null, item.fresh),
    })

    if (item.article.duplicateCluster) {
      seenClusters.add(item.article.duplicateCluster)
    }
    if (primaryTopicId) {
      topicUsage.set(primaryTopicId, usage + 1)
    }
  }

  selected.sort((a, b) => b.score - a.score)

  if (CACHEABLE_LIMITS.includes(limit)) {
    await cacheSet(cacheKey, selected, CACHE_TTL_SECONDS)
  }

  return selected
}

function buildReason(topic: string | null, fresh: number): string {
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

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}
