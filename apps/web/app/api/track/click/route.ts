import { NextResponse, type NextRequest } from "next/server"

import { prisma } from "@workspace/database"
import { DOMAIN_EVENTS } from "@workspace/shared/events"

import { getAppUrl } from "@/lib/app-url"
import { dispatchEvent } from "@/lib/events"
import {
  recordInteraction,
  trackEvent,
} from "@/modules/analytics/analytics.service"

export async function GET(request: NextRequest) {
  const newsletterId = request.nextUrl.searchParams.get("n")
  const articleId = request.nextUrl.searchParams.get("a")
  const origin = getAppUrl(request.nextUrl.origin)

  if (!articleId) {
    return NextResponse.redirect(new URL("/", origin))
  }

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    select: { url: true },
  })

  if (!article) {
    return NextResponse.redirect(new URL("/", origin))
  }

  let userId: string | null = null
  if (newsletterId) {
    const newsletter = await prisma.newsletter.findUnique({
      where: { id: newsletterId },
      select: { userId: true },
    })
    userId = newsletter?.userId ?? null
  }

  await trackEvent("ARTICLE_CLICKED", {
    userId,
    metadata: { articleId, newsletterId },
  })

  if (userId) {
    await recordInteraction(userId, articleId, "CLICKED")
  }

  dispatchEvent(DOMAIN_EVENTS.ArticleClicked, {
    articleId,
    userId: userId ?? undefined,
  })

  return NextResponse.redirect(article.url)
}
