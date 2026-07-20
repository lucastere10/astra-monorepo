import { NextResponse, type NextRequest } from "next/server"

import { getAppUrl } from "@/lib/app-url"
import { unsubscribeByToken } from "@/modules/unsubscribe/service"

/**
 * RFC 8058 one-click unsubscribe endpoint.
 * Gmail/Outlook POST here with body `List-Unsubscribe=One-Click`.
 */
export async function POST(request: NextRequest) {
  const token =
    request.nextUrl.searchParams.get("t") ??
    request.nextUrl.searchParams.get("token")

  const result = await unsubscribeByToken(token)

  if (!result.ok) {
    return NextResponse.json(
      { error: result.error === "missing" ? "Missing token" : "Invalid token" },
      { status: result.error === "missing" ? 400 : 404 }
    )
  }

  return new NextResponse(null, { status: 200 })
}

/** Redirect browsers that open the List-Unsubscribe URL to the confirm page. */
export async function GET(request: NextRequest) {
  const token =
    request.nextUrl.searchParams.get("t") ??
    request.nextUrl.searchParams.get("token")
  const base = getAppUrl(request.nextUrl.origin)
  const url = new URL("/unsubscribe", base)
  if (token) url.searchParams.set("t", token)
  return NextResponse.redirect(url)
}
