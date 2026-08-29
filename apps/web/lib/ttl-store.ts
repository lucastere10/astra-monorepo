import "server-only"

import { cacheDel, cacheGet, cacheSet } from "@/lib/redis"

type MemoryEntry = { value: unknown; expiresAt: number }

const globalForStore = globalThis as unknown as {
  ttlMemory: Map<string, MemoryEntry> | undefined
}

function memoryMap(): Map<string, MemoryEntry> {
  globalForStore.ttlMemory ??= new Map()
  return globalForStore.ttlMemory
}

/** Write-through cache: Redis when available, in-process Map otherwise. */
export async function storeSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<void> {
  await cacheSet(key, value, ttlSeconds)
  memoryMap().set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  })
}

export async function storeGet<T>(key: string): Promise<T | null> {
  const fromRedis = await cacheGet<T>(key)
  if (fromRedis !== null) return fromRedis

  const entry = memoryMap().get(key)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    memoryMap().delete(key)
    return null
  }
  return entry.value as T
}

export async function storeDel(key: string): Promise<void> {
  memoryMap().delete(key)
  await cacheDel(key)
}
