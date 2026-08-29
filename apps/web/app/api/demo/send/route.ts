import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { consumeRateLimit } from "@/lib/rate-limit"
import { clientIp } from "@/lib/request-ip"
import {
  getStoredPreview,
  sendDemoEdition,
} from "@/modules/demo/demo.service"

const SEND_LIMIT = 2
const SEND_WINDOW_SECONDS = 60 * 60

const bodySchema = z.object({
  previewId: z.string().min(1),
  email: z.email({ error: "Please enter a valid email address." }).trim(),
})

export async function POST(request: NextRequest) {
  const allowed = await consumeRateLimit(
    `demo:send:${clientIp(request)}`,
    SEND_LIMIT,
    SEND_WINDOW_SECONDS
  )
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many sample emails. Please try again later." },
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
    await sendDemoEdition(email, preview)
    return NextResponse.json({ sent: true, email })
  } catch (error) {
    console.error("[demo] send failed", error)
    return NextResponse.json(
      { error: "Failed to send the sample edition." },
      { status: 500 }
    )
  }
}
