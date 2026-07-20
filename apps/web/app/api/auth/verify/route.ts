import { NextResponse, type NextRequest } from "next/server"

import { prisma } from "@workspace/database"

import { getAppUrl } from "@/lib/app-url"
import { consumeMagicLinkToken } from "@/modules/auth/tokens"
import { createSession } from "@/modules/auth/session"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")
  const base = getAppUrl(request.nextUrl.origin)
  const loginUrl = new URL("/login", base)

  if (!token) {
    loginUrl.searchParams.set("error", "missing-token")
    return NextResponse.redirect(loginUrl)
  }

  const consumed = await consumeMagicLinkToken(token)
  if (!consumed) {
    loginUrl.searchParams.set("error", "invalid-token")
    return NextResponse.redirect(loginUrl)
  }

  const existing = await prisma.user.findUnique({
    where: { email: consumed.email },
    select: { id: true, email: true, role: true },
  })

  const user =
    existing ??
    (await prisma.user.create({
      data: { email: consumed.email, emailVerified: new Date() },
      select: { id: true, email: true, role: true },
    }))

  if (!existing) {
    await prisma.analyticsEvent.create({
      data: { userId: user.id, type: "SUBSCRIPTION_CREATED" },
    })
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    })
  }

  await createSession(user)

  return NextResponse.redirect(new URL("/dashboard", base))
}
