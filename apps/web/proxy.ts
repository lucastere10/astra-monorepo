import { NextResponse, type NextRequest } from "next/server"

import { decryptSession, SESSION_COOKIE } from "@/modules/auth/session-token"

const PROTECTED_PREFIXES = ["/dashboard", "/preferences", "/newsletters", "/admin"]
const AUTH_ROUTES = ["/login", "/verify"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route))

  if (!isProtected && !isAuthRoute) {
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const session = await decryptSession(token)

  if (isProtected && !session?.userId) {
    const loginUrl = new URL("/login", request.nextUrl.origin)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && session?.userId) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl.origin))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
}
