"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Mail } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

interface SendNewsletterButtonProps {
  newsletterId: string
  disabled?: boolean
}

export function SendNewsletterButton({
  newsletterId,
  disabled = false,
}: SendNewsletterButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleClick() {
    setError(null)
    setSuccess(false)
    setLoading(true)

    try {
      const res = await fetch(`/api/newsletters/${newsletterId}/send`, {
        method: "POST",
      })
      const data = (await res.json()) as { error?: string }

      if (!res.ok) {
        setError(data.error ?? "Could not send this edition right now.")
        return
      }

      setSuccess(true)
      startTransition(() => {
        router.refresh()
      })
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (disabled) {
    return null
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        onClick={handleClick}
        disabled={loading || isPending || success}
        size="sm"
        variant={success ? "secondary" : "default"}
      >
        {loading || isPending ? (
          <Loader2 className="animate-spin" />
        ) : (
          <Mail />
        )}
        {success ? "Sent to your inbox" : "Send by email"}
      </Button>
      {error && <span className="text-destructive text-xs">{error}</span>}
    </div>
  )
}
