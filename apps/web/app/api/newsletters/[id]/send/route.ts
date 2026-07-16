import { NextResponse, type NextRequest } from "next/server"

import { prisma } from "@workspace/database"

import { getCurrentUser } from "@/modules/auth/dal"
import { sendNewsletter } from "@/modules/newsletter/newsletter.service"

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const newsletter = await prisma.newsletter.findFirst({
    where: { id, userId: user.id },
    select: { id: true, status: true, htmlContent: true },
  })

  if (!newsletter) {
    return NextResponse.json({ error: "Newsletter not found." }, { status: 404 })
  }

  if (newsletter.status === "SENT") {
    return NextResponse.json(
      { error: "This edition was already sent." },
      { status: 409 }
    )
  }

  if (!newsletter.htmlContent) {
    return NextResponse.json(
      { error: "This edition is not ready to send yet." },
      { status: 422 }
    )
  }

  try {
    await sendNewsletter(newsletter.id)
    return NextResponse.json({ sent: true })
  } catch (error) {
    console.error("[newsletter] send failed", error)
    return NextResponse.json(
      { error: "Failed to send newsletter." },
      { status: 500 }
    )
  }
}
