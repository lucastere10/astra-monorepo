import "server-only"

import { prisma } from "@workspace/database"

import {
  DEFAULT_PAGE_SIZE,
  paginateMeta,
} from "@/lib/pagination"

export { parsePage } from "@/lib/pagination"
export type { PaginatedResult } from "@/lib/pagination"

export const ADMIN_PAGE_SIZE = DEFAULT_PAGE_SIZE

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

export async function listUsers(page = 1) {
  const total = await prisma.user.count()
  const meta = paginateMeta(total, page, ADMIN_PAGE_SIZE)

  const items = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    skip: meta.skip,
    take: meta.pageSize,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { preferences: true, newsletters: true } },
    },
  })

  return {
    items,
    total: meta.total,
    page: meta.page,
    pageSize: meta.pageSize,
    totalPages: meta.totalPages,
  }
}

export async function listSources(page = 1) {
  const total = await prisma.newsSource.count()
  const meta = paginateMeta(total, page, ADMIN_PAGE_SIZE)

  const items = await prisma.newsSource.findMany({
    orderBy: { createdAt: "desc" },
    skip: meta.skip,
    take: meta.pageSize,
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

  return {
    items,
    total: meta.total,
    page: meta.page,
    pageSize: meta.pageSize,
    totalPages: meta.totalPages,
  }
}

export async function searchArticles(query?: string, page = 1) {
  const where = query
    ? {
        OR: [
          { title: { contains: query, mode: "insensitive" as const } },
          { summary: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : undefined

  const total = await prisma.article.count({ where })
  const meta = paginateMeta(total, page, ADMIN_PAGE_SIZE)

  const items = await prisma.article.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: meta.skip,
    take: meta.pageSize,
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

  return {
    items,
    total: meta.total,
    page: meta.page,
    pageSize: meta.pageSize,
    totalPages: meta.totalPages,
  }
}

export async function listAdminNewsletters(page = 1) {
  const total = await prisma.newsletter.count()
  const meta = paginateMeta(total, page, ADMIN_PAGE_SIZE)

  const items = await prisma.newsletter.findMany({
    orderBy: { createdAt: "desc" },
    skip: meta.skip,
    take: meta.pageSize,
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

  return {
    items,
    total: meta.total,
    page: meta.page,
    pageSize: meta.pageSize,
    totalPages: meta.totalPages,
  }
}

export async function listWorkerExecutions(page = 1) {
  const total = await prisma.workerExecution.count()
  const meta = paginateMeta(total, page, ADMIN_PAGE_SIZE)

  const items = await prisma.workerExecution.findMany({
    orderBy: { startedAt: "desc" },
    skip: meta.skip,
    take: meta.pageSize,
  })

  return {
    items,
    total: meta.total,
    page: meta.page,
    pageSize: meta.pageSize,
    totalPages: meta.totalPages,
  }
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
