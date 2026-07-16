import "server-only"

import { cache } from "react"
import { redirect } from "next/navigation"

import { prisma } from "@workspace/database"

import { getSession, type SessionPayload } from "./session"

/**
 * Verify the optimistic session from the cookie. Redirects to /login when the
 * user is not authenticated. Memoized per-request via React `cache`.
 */
export const verifySession = cache(async (): Promise<SessionPayload> => {
  const session = await getSession()
  if (!session?.userId) {
    redirect("/login")
  }
  return session
})

/**
 * Securely fetch the current user from the database (source of truth for role
 * and profile). Returns null when the session is missing or the user no longer
 * exists.
 */
export const getCurrentUser = cache(async () => {
  const session = await getSession()
  if (!session?.userId) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      createdAt: true,
    },
  })

  return user
})

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  return user
}

export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  if (user.role !== "ADMIN") {
    redirect("/dashboard")
  }
  return user
}
