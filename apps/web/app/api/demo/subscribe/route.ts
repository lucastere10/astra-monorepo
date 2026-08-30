import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { consumeRateLimit } from "@/lib/rate-limit"
import { clientIp } from "@/lib/request-ip"
import {
  getStoredPreview,
  requestDemoSubscription,
} from "@/modules/demo/demo.service"

const SUBSCRIBE_LIMIT = 2
const SUBSCRIBE_WINDOW_SECONDS = 60 * 60

const bodySchema = z.object({
  previewId: z.string().min(1),
  email: z.email({ error: "Please enter a valid email address." }).trim(),
})

export async function POST(request: NextRequest) {
  const allowed = await consumeRateLimit(
    `demo:subscribe:${clientIp(request)}`,
    SUBSCRIBE_LIMIT,
    SUBSCRIBE_WINDOW_SECONDS
  )
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please try again later." },
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
      { error: parsed.error.issues[0]?.message ?? "Invalid request." },
      { status: 400 }
    )
  }

  const email = parsed.data.email.toLowerCase()
  const preview = await getStoredPreview(parsed.data.previewId)
  if (!preview) {
    return NextResponse.json(
      { error: "That preview expired. Generate a new edition and try again." },
      { status: 410 }
    )
  }

  try {
    await requestDemoSubscription(email, preview.topicSlugs)
    return NextResponse.json({ sent: true, email })
  } catch (error) {
    console.error("[demo] subscribe failed", error)
    return NextResponse.json(
      { error: "Failed to send the sign-in link." },
      { status: 500 }
    )
  }
}
