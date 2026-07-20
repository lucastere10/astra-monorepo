import "server-only"

import { prisma } from "@workspace/database"

import {
  DEFAULT_PAGE_SIZE,
  paginateMeta,
  type PaginatedResult,
} from "@/lib/pagination"

export { parsePage } from "@/lib/pagination"

export async function getUserNewsletters(userId: string, page = 1) {
  const where = { userId }
  const total = await prisma.newsletter.count({ where })
  const meta = paginateMeta(total, page, DEFAULT_PAGE_SIZE)

  const items = await prisma.newsletter.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: meta.skip,
    take: meta.pageSize,
    select: {
      id: true,
      subject: true,
      status: true,
      cadence: true,
      createdAt: true,
      sentAt: true,
      _count: { select: { articles: true } },
    },
  })

  return {
    items,
    total: meta.total,
    page: meta.page,
    pageSize: meta.pageSize,
    totalPages: meta.totalPages,
  } satisfies PaginatedResult<(typeof items)[number]>
}

export async function getNewsletterForUser(id: string, userId: string) {
  return prisma.newsletter.findFirst({
    where: { id, userId },
    include: {
      articles: {
        orderBy: { rank: "asc" },
        include: {
          article: {
            select: {
              id: true,
              title: true,
              summary: true,
              url: true,
              readingTimeMin: true,
              source: { select: { name: true } },
              topics: {
                include: { topic: { select: { name: true } } },
              },
            },
          },
        },
      },
    },
  })
}
