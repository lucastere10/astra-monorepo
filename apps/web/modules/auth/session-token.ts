import { SignJWT, jwtVerify } from "jose"
import type { Role } from "@workspace/database"

export const SESSION_COOKIE = "kh_session"
export const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export interface SessionPayload {
  userId: string
  email: string
  role: Role
  expiresAt: string
}

function getEncodedKey() {
  const secret = process.env.SESSION_SECRET
  if (!secret) {
    throw new Error("SESSION_SECRET is not set")
  }
  return new TextEncoder().encode(secret)
}

export async function encryptSession(payload: {
  userId: string
  email: string
  role: Role
  expiresAt: Date
}): Promise<string> {
  return new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    expiresAt: payload.expiresAt.toISOString(),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getEncodedKey())
}

export async function decryptSession(
  token: string | undefined
): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getEncodedKey(), {
      algorithms: ["HS256"],
    })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}
