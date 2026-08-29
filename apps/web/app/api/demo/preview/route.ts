import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { TOPICS, type TopicSlug } from "@workspace/shared/topics"

import { consumeRateLimit } from "@/lib/rate-limit"
import { clientIp } from "@/lib/request-ip"
import { previewNewsletterForTopics } from "@/modules/demo/demo.service"

const PREVIEW_LIMIT = 5
const PREVIEW_WINDOW_SECONDS = 10 * 60

const TOPIC_SLUGS = TOPICS.map((topic) => topic.slug) as [
  TopicSlug,
  ...TopicSlug[],
]

const bodySchema = z.object({
  topics: z
    .array(z.enum(TOPIC_SLUGS))
    .min(2, { error: "Choose at least 2 topics." })
    .max(5, { error: "Choose at most 5 topics." })
    .refine((topics) => new Set(topics).size === topics.length, {
      error: "Topics must be unique.",
    }),
})

export async function POST(request: NextRequest) {
  const allowed = await consumeRateLimit(
    `demo:preview:${clientIp(request)}`,
    PREVIEW_LIMIT,
    PREVIEW_WINDOW_SECONDS
  )
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many previews. Please try again in a few minutes." },
      { status: 429 }
    )
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid topics." },
      { status: 400 }
    )
  }

  try {
    const preview = await previewNewsletterForTopics(parsed.data.topics)
    if (!preview) {
      return NextResponse.json(
        { error: "No suitable articles for those topics yet." },
        { status: 422 }
      )
    }
    return NextResponse.json(preview)
  } catch (error) {
    console.error("[demo] preview failed", error)
    return NextResponse.json(
      { error: "Failed to generate a preview." },
      { status: 500 }
    )
  }
}
