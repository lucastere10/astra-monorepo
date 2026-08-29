import "server-only"

import { cacheIncr } from "@/lib/redis"

const memoryBuckets = new Map<string, { count: number; resetAt: number }>()

/**
 * Consume one unit of a sliding fixed-window limit. Uses Redis when available
 * and falls back to an in-process counter (per instance).
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const redisCount = await cacheIncr(key, windowSeconds)
  if (redisCount !== null) {
    return redisCount <= limit
  }

  const now = Date.now()
  const existing = memoryBuckets.get(key)
  if (!existing || existing.resetAt <= now) {
    memoryBuckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return true
  }

  existing.count += 1
  return existing.count <= limit
}
