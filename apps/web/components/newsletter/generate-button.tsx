"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Sparkles } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

export function GenerateNewsletterButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/newsletters/generate", { method: "POST" })
      const data = (await res.json()) as { newsletterId?: string; error?: string }
      if (!res.ok || !data.newsletterId) {
        setError(data.error ?? "Could not generate a newsletter right now.")
        return
      }
      startTransition(() => {
        router.push(`/newsletters/${data.newsletterId}`)
        router.refresh()
      })
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button onClick={handleClick} disabled={loading || isPending} size="sm">
        {loading || isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Sparkles />
        )}
        Generate edition
      </Button>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  )
}
