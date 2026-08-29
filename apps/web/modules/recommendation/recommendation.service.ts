import "server-only"

import { prisma } from "@workspace/database"
import {
  articleLimitForCadence,
  DIVERSITY_PENALTY_BY_CADENCE,
  SOURCE_FAMILY_CAP_BY_CADENCE,
  type NewsletterCadence,
} from "@workspace/shared/cadence"
import {
  clamp01,
  computeRankScore,
  freshnessScore,
} from "@workspace/shared/scoring"
import { sourceFamily } from "@workspace/shared/sources"
import { DEFAULT_TOPIC_WEIGHT } from "@workspace/shared/topics"

import { cacheDel, cacheGet, cacheSet } from "@/lib/redis"
import { buildReason } from "@/modules/newsletter/newsletter.copy"

export interface RankedArticle {
  articleId: string
  title: string
  score: number
  topTopic: string | null
  reason: string
}

const PER_SOURCE_CANDIDATES = 12
const INTERACTION_SAMPLE = 500
const CACHE_TTL_SECONDS = 300
const CACHEABLE_LIMITS = [4, 6, 8, 10, 12]
const CANDIDATE_LOOKBACK_DAYS = 30

export interface RankOptions {
  limit?: number
  cadence?: NewsletterCadence
}

type CandidateArticle = {
  id: string
  title: string
  globalScore: number
  publishedAt: Date | null
  duplicateCluster: string | null
  sourceUrl: string | null
  topics: {
    topicId: string
    relevance: number
    topic: { name: string }
  }[]
}

const candidateSelect = {
  id: true,
  title: true,
  globalScore: true,
  publishedAt: true,
  duplicateCluster: true,
  source: { select: { url: true } },
  topics: {
    select: {
      topicId: true,
      relevance: true,
      topic: { select: { name: true } },
    },
  },
} as const

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

function toCandidate(
  article: {
    id: string
    title: string
    globalScore: number
    publishedAt: Date | null
    duplicateCluster: string | null
    source: { url: string } | null
    topics: CandidateArticle["topics"]
  }
): CandidateArticle {
  return {
    id: article.id,
    title: article.title,
    globalScore: article.globalScore,
    publishedAt: article.publishedAt,
    duplicateCluster: article.duplicateCluster,
    sourceUrl: article.source?.url ?? null,
    topics: article.topics,
  }
}

async function loadRecentCandidates(): Promise<CandidateArticle[]> {
  const since = daysAgo(CANDIDATE_LOOKBACK_DAYS)
  const recent = {
    OR: [
      { publishedAt: { gte: since } },
      { publishedAt: null, createdAt: { gte: since } },
    ],
  }

  const sources = await prisma.newsSource.findMany({
    where: { isActive: true },
    select: { id: true },
  })

  const batches = await Promise.all([
    ...sources.map((source) =>
      prisma.article.findMany({
        where: { sourceId: source.id, ...recent },
        orderBy: { globalScore: "desc" },
        take: PER_SOURCE_CANDIDATES,
        select: candidateSelect,
      })
    ),
    prisma.article.findMany({
      where: { sourceId: null, ...recent },
      orderBy: { globalScore: "desc" },
      take: PER_SOURCE_CANDIDATES,
      select: candidateSelect,
    }),
  ])

  return batches.flat().map(toCandidate)
}

type ScoredCandidate = {
  article: CandidateArticle
  baseScore: number
  topTopic: { name: string; weight: number } | null
  fresh: number
  family: string
}

function scoreCandidate(
  article: CandidateArticle,
  weightByTopic: Map<string, number>,
  engagementByTopic: Map<string, number>,
  totalWeight: number,
  maxEngagement: number,
  now: Date
): ScoredCandidate {
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

  return {
    article,
    baseScore: computeRankScore({
      globalScore: article.globalScore,
      topicAffinity,
      interactionScore,
      freshnessScore: fresh,
      diversityBonus: 0,
    }),
    topTopic,
    fresh,
    family: sourceFamily(article.sourceUrl),
  }
}

function selectRankedArticles(options: {
  candidates: CandidateArticle[]
  weightByTopic: Map<string, number>
  engagementByTopic: Map<string, number>
  limit: number
  cadence: NewsletterCadence
}): RankedArticle[] {
  const {
    candidates,
    weightByTopic,
    engagementByTopic,
    limit,
    cadence,
  } = options
  const diversityPenalty = DIVERSITY_PENALTY_BY_CADENCE[cadence]
  const familyCap = SOURCE_FAMILY_CAP_BY_CADENCE[cadence]
  const totalWeight = [...weightByTopic.values()].reduce(
    (sum, weight) => sum + weight,
    0
  )
  const maxEngagement = Math.max(1, ...engagementByTopic.values())
  const now = new Date()

  const scored = candidates.map((article) =>
    scoreCandidate(
      article,
      weightByTopic,
      engagementByTopic,
      totalWeight,
      maxEngagement,
      now
    )
  )

  scored.sort((a, b) => b.baseScore - a.baseScore)

  const selected: RankedArticle[] = []
  const seenClusters = new Set<string>()
  const topicUsage = new Map<string, number>()
  const familyUsage = new Map<string, number>()

  for (const item of scored) {
    if (selected.length >= limit) break

    if (
      item.article.duplicateCluster &&
      seenClusters.has(item.article.duplicateCluster)
    ) {
      continue
    }

    const familyCount = familyUsage.get(item.family) ?? 0
    if (familyCount >= familyCap) continue

    const primaryTopicId = item.article.topics[0]?.topicId
    const topicCount = primaryTopicId
      ? (topicUsage.get(primaryTopicId) ?? 0)
      : 0
    const adjustedScore =
      item.baseScore -
      topicCount * diversityPenalty -
      familyCount * diversityPenalty

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
      topicUsage.set(primaryTopicId, topicCount + 1)
    }
    familyUsage.set(item.family, familyCount + 1)
  }

  selected.sort((a, b) => b.score - a.score)
  return selected
}

/**
 * Produce a personalized ranking of articles for a user. Combines several
 * signals (global quality, topic affinity, engagement, freshness) and applies
 * a diversity penalty greedily so a single topic or source cannot dominate.
 */
export async function rankArticlesForUser(
  userId: string,
  limitOrOptions: number | RankOptions = {}
): Promise<RankedArticle[]> {
  const options: RankOptions =
    typeof limitOrOptions === "number"
      ? { limit: limitOrOptions }
      : limitOrOptions
  const cadence = options.cadence ?? "WEEKLY"
  const limit = options.limit ?? articleLimitForCadence(cadence)

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
    loadRecentCandidates(),
  ])

  const weightByTopic = new Map(preferences.map((p) => [p.topicId, p.weight]))
  const engagementByTopic = new Map<string, number>()
  for (const interaction of interactions) {
    for (const t of interaction.article.topics) {
      engagementByTopic.set(
        t.topicId,
        (engagementByTopic.get(t.topicId) ?? 0) + 1
      )
    }
  }

  const selected = selectRankedArticles({
    candidates,
    weightByTopic,
    engagementByTopic,
    limit,
    cadence,
  })

  if (CACHEABLE_LIMITS.includes(limit)) {
    await cacheSet(cacheKey, selected, CACHE_TTL_SECONDS)
  }

  return selected
}

/**
 * Rank recent articles for a guest using equal weights on the given topic
 * slugs. Unknown slugs are ignored. Returns an empty list when none resolve.
 * Does not use engagement history or the per-user recommendation cache.
 */
export async function rankArticlesForTopicSlugs(
  slugs: string[],
  options: RankOptions = {}
): Promise<RankedArticle[]> {
  const unique = [...new Set(slugs.filter(Boolean))]
  if (unique.length === 0) return []

  const cadence = options.cadence ?? "WEEKLY"
  const limit = options.limit ?? articleLimitForCadence(cadence)

  const [topics, candidates] = await Promise.all([
    prisma.topic.findMany({
      where: { slug: { in: unique } },
      select: { id: true },
    }),
    loadRecentCandidates(),
  ])

  if (topics.length === 0) return []

  const weightByTopic = new Map(
    topics.map((topic) => [topic.id, DEFAULT_TOPIC_WEIGHT])
  )

  return selectRankedArticles({
    candidates,
    weightByTopic,
    engagementByTopic: new Map(),
    limit,
    cadence,
  })
}

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000)
}
