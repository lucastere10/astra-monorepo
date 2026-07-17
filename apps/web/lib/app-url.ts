/**
 * Public base URL for absolute redirects and email links.
 * Prefer NEXT_PUBLIC_APP_URL — request.nextUrl.origin is wrong on Cloud Run
 * (container listens on 0.0.0.0:8080).
 */
export function getAppUrl(fallbackOrigin?: string): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    fallbackOrigin ??
    "http://localhost:3000"
  )
}
