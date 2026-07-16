import { type NextRequest } from "next/server"

import { prisma } from "@workspace/database"

import { trackEvent, TRACKING_PIXEL } from "@/modules/analytics/analytics.service"

export async function GET(request: NextRequest) {
  const newsletterId = request.nextUrl.searchParams.get("n")

  if (newsletterId) {
    const newsletter = await prisma.newsletter.findUnique({
      where: { id: newsletterId },
      select: { userId: true },
    })
    if (newsletter) {
      await trackEvent("NEWSLETTER_OPENED", {
        userId: newsletter.userId,
        metadata: { newsletterId },
      })
    }
  }

  return new Response(new Uint8Array(TRACKING_PIXEL), {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
    },
  })
}
