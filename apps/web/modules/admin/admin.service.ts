import "server-only"

import { prisma } from "@workspace/database"

export async function getAdminOverview() {
  const [
    userCount,
    articleCount,
    sourceCount,
    activeSourceCount,
    newsletterCount,
    sentNewsletterCount,
    lastWorker,
    eventCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.article.count(),
    prisma.newsSource.count(),
    prisma.newsSource.count({ where: { isActive: true } }),
    prisma.newsletter.count(),
    prisma.newsletter.count({ where: { status: "SENT" } }),
    prisma.workerExecution.findFirst({ orderBy: { startedAt: "desc" } }),
    prisma.analyticsEvent.count(),
  ])

  return {
    userCount,
    articleCount,
    sourceCount,
    activeSourceCount,
    newsletterCount,
    sentNewsletterCount,
    lastWorker,
    eventCount,
  }
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { preferences: true, newsletters: true } },
    },
  })
}

export async function listSources() {
  return prisma.newsSource.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      url: true,
      type: true,
      isActive: true,
      lastFetchedAt: true,
      _count: { select: { articles: true } },
    },
  })
}

export async function searchArticles(query?: string) {
  return prisma.article.findMany({
    where: query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { summary: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      url: true,
      globalScore: true,
      readingTimeMin: true,
      publishedAt: true,
      createdAt: true,
      source: { select: { name: true } },
      _count: { select: { topics: true } },
    },
  })
}

export async function listAdminNewsletters() {
  return prisma.newsletter.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      subject: true,
      status: true,
      createdAt: true,
      sentAt: true,
      user: { select: { email: true } },
      _count: { select: { articles: true } },
    },
  })
}

export async function listWorkerExecutions() {
  return prisma.workerExecution.findMany({
    orderBy: { startedAt: "desc" },
    take: 50,
  })
}

export async function getAnalyticsSummary() {
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ["type"],
    _count: { _all: true },
  })

  const total = grouped.reduce((sum, row) => sum + row._count._all, 0)

  return {
    total,
    byType: grouped
      .map((row) => ({ type: row.type, count: row._count._all }))
      .sort((a, b) => b.count - a.count),
  }
}
