import "server-only"

import { cookies } from "next/headers"
import type { Role } from "@workspace/database"

import {
  decryptSession,
  encryptSession,
  SESSION_COOKIE,
  SESSION_DURATION_MS,
  type SessionPayload,
} from "./session-token"

export type { SessionPayload }
export { SESSION_COOKIE }

export async function createSession(user: {
  id: string
  email: string
  role: Role
}): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  const token = await encryptSession({
    userId: user.id,
    email: user.email,
    role: user.role,
    expiresAt,
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  return decryptSession(token)
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
