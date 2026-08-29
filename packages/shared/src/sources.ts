/**
 * Group sibling feeds (HN Front Page + Best, arXiv cs.AI + cs.LG, Exa
 * queries) without a schema change. Uses the NewsSource URL host.
 */
export function sourceFamily(sourceUrl: string | null | undefined): string {
  if (!sourceUrl) return "unknown"
  const trimmed = sourceUrl.trim()
  if (trimmed.startsWith("exa:") || trimmed.startsWith("exa://")) return "exa"
  try {
    const host = new URL(trimmed).hostname.replace(/^www\./, "")
    if (host) return host
  } catch {
    // not a standard URL
  }
  return trimmed
}
