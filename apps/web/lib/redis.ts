import "server-only"

import Redis from "ioredis"

const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined
  redisDisabled: boolean | undefined
}

function disableRedis(client: Redis): void {
  if (globalForRedis.redisDisabled) {
    return
  }

  globalForRedis.redisDisabled = true
  globalForRedis.redis = null
  client.disconnect()
}

/**
 * Lazily create a single Redis client. When `REDIS_URL` is not configured the
 * client is `null` and all cache helpers become no-ops, so the app runs fine
 * without Redis in development. If Redis is configured but unreachable, the
 * client is disabled after the first failure so requests keep working.
 */
function getRedis(): Redis | null {
  if (globalForRedis.redisDisabled) {
    return null
  }

  if (globalForRedis.redis !== undefined) {
    return globalForRedis.redis
  }

  const url = process.env.REDIS_URL
  if (!url) {
    globalForRedis.redis = null
    return null
  }

  let errorLogged = false

  const client = new Redis(url, {
    maxRetriesPerRequest: 1,
    lazyConnect: true,
    enableOfflineQueue: false,
    retryStrategy(times) {
      if (times > 3) {
        disableRedis(client)
        return null
      }

      return Math.min(times * 200, 1000)
    },
  })

  client.on("error", (error) => {
    if (!errorLogged) {
      errorLogged = true
      console.error(
        "[redis] connection error — cache disabled:",
        error.message
      )
    }

    disableRedis(client)
  })

  globalForRedis.redis = client
  return client
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedis()
  if (!client) return null
  try {
    const raw = await client.get(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch (error) {
    console.error("[redis] get failed", error)
    return null
  }
}

export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  const client = getRedis()
  if (!client) return
  try {
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds)
  } catch (error) {
    console.error("[redis] set failed", error)
  }
}

export async function cacheDel(key: string): Promise<void> {
  const client = getRedis()
  if (!client) return
  try {
    await client.del(key)
  } catch (error) {
    console.error("[redis] del failed", error)
  }
}
