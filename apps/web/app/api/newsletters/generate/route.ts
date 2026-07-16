import { NextResponse, type NextRequest } from "next/server"

import { getCurrentUser } from "@/modules/auth/dal"
import {
  generateNewsletterForUser,
  sendNewsletter,
} from "@/modules/newsletter/newsletter.service"

export async function POST(request: NextRequest) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const shouldSend = request.nextUrl.searchParams.get("send") === "1"

  try {
    const newsletterId = await generateNewsletterForUser(user.id)

    if (!newsletterId) {
      return NextResponse.json(
        { error: "No suitable articles available yet." },
        { status: 422 }
      )
    }

    if (shouldSend) {
      await sendNewsletter(newsletterId)
    }

    return NextResponse.json({ newsletterId, sent: shouldSend })
  } catch (error) {
    console.error("[newsletter] generation failed", error)
    return NextResponse.json(
      { error: "Failed to generate newsletter." },
      { status: 500 }
    )
  }
}
