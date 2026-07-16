import "server-only"

import { prisma } from "@workspace/database"
import type { AnalyticsEventType, InteractionType } from "@workspace/database"

export async function trackEvent(
  type: AnalyticsEventType,
  options: { userId?: string | null; metadata?: Record<string, unknown> } = {}
): Promise<void> {
  try {
    await prisma.analyticsEvent.create({
      data: {
        type,
        userId: options.userId ?? null,
        metadata: options.metadata as never,
      },
    })
  } catch (error) {
    console.error("[analytics] failed to track event", type, error)
  }
}

export async function recordInteraction(
  userId: string,
  articleId: string,
  type: InteractionType
): Promise<void> {
  try {
    await prisma.userArticleInteraction.create({
      data: { userId, articleId, type },
    })
  } catch (error) {
    console.error("[analytics] failed to record interaction", error)
  }
}

/** 1x1 transparent GIF used as an email open-tracking pixel. */
export const TRACKING_PIXEL = Buffer.from(
  "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
  "base64"
)
