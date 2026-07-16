import "server-only"

import { prisma } from "@workspace/database"

export async function getUserNewsletters(userId: string) {
  return prisma.newsletter.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
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
