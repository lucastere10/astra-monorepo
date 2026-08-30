"use client"

import { useEffect, useState } from "react"

import type { DemoPreview } from "@/modules/demo/types"

import { DemoPreviewCanvas } from "./demo-preview"
import { DemoSubscribeCard } from "./demo-subscribe-card"
import { Hero } from "./hero"

export function LandingDemo() {
  const [preview, setPreview] = useState<DemoPreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cardDismissed, setCardDismissed] = useState(false)

  const showEdition = loading || Boolean(preview)

  useEffect(() => {
    if (!preview) return
    document
      .getElementById("edition")
      ?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [preview])

  async function generate(topics: string[]) {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/demo/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topics }),
      })
      const data = (await res.json()) as DemoPreview & { error?: string }
      if (!res.ok) {
        setError(data.error ?? "Could not generate a preview right now.")
        return
      }
      setPreview(data)
      setCardDismissed(false)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Hero onGenerate={generate} loading={loading} error={error} />
      {showEdition ? (
        <DemoPreviewCanvas
          preview={preview}
          loading={loading}
          error={error}
          aside={
            preview && !cardDismissed ? (
              <DemoSubscribeCard
                preview={preview}
                onDismiss={() => setCardDismissed(true)}
              />
            ) : null
          }
        />
      ) : null}
    </>
  )
}
