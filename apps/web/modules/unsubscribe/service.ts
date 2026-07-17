import "server-only"

import { prisma } from "@workspace/database"

export type UnsubscribeResult =
  | { ok: true; alreadyUnsubscribed: boolean; email: string }
  | { ok: false; error: "missing" | "invalid" }

/**
 * Disable all automatic digests for the user identified by unsubscribeToken.
 * Idempotent when already disabled.
 */
export async function unsubscribeByToken(
  token: string | null | undefined
): Promise<UnsubscribeResult> {
  if (!token || !token.trim()) {
    return { ok: false, error: "missing" }
  }

  const user = await prisma.user.findUnique({
    where: { unsubscribeToken: token.trim() },
    select: { id: true, email: true, autoSendEnabled: true },
  })

  if (!user) {
    return { ok: false, error: "invalid" }
  }

  if (!user.autoSendEnabled) {
    return { ok: true, alreadyUnsubscribed: true, email: user.email }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { autoSendEnabled: false },
    }),
    prisma.analyticsEvent.create({
      data: { userId: user.id, type: "UNSUBSCRIBED" },
    }),
  ])

  return { ok: true, alreadyUnsubscribed: false, email: user.email }
}

export async function lookupUnsubscribeToken(token: string | null | undefined) {
  if (!token || !token.trim()) return null
  return prisma.user.findUnique({
    where: { unsubscribeToken: token.trim() },
    select: { email: true, autoSendEnabled: true },
  })
}
