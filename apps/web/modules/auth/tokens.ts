import "server-only"

import { createHash, randomBytes } from "node:crypto"

import { prisma } from "@workspace/database"

const TOKEN_TTL_MS = 15 * 60 * 1000

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

/**
 * Create a single-use magic-link token for the given email. The raw token is
 * returned (to embed in the link); only its hash is persisted.
 */
export async function createMagicLinkToken(email: string): Promise<string> {
  const rawToken = randomBytes(32).toString("hex")
  const tokenHash = hashToken(rawToken)
  const expires = new Date(Date.now() + TOKEN_TTL_MS)

  await prisma.verificationToken.create({
    data: { identifier: email.toLowerCase(), token: tokenHash, expires },
  })

  return rawToken
}

export interface ConsumedToken {
  email: string
}

/**
 * Validate and consume a magic-link token. Returns the associated email when
 * valid, or null when missing/expired. The token is always deleted if found.
 */
export async function consumeMagicLinkToken(
  rawToken: string
): Promise<ConsumedToken | null> {
  const tokenHash = hashToken(rawToken)

  const record = await prisma.verificationToken.findUnique({
    where: { token: tokenHash },
  })

  if (!record) return null

  await prisma.verificationToken.delete({ where: { token: tokenHash } })

  if (record.expires < new Date()) {
    return null
  }

  return { email: record.identifier }
}
