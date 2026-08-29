"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowRight, Loader2, Sparkles } from "lucide-react"

import { TOPICS } from "@workspace/shared/topics"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

const MIN_TOPICS = 2
const MAX_TOPICS = 5
const DEFAULT_SELECTED = ["ai-agents", "llms", "mcp"] as const
const GENERATE_STATUSES = [
  "Collecting…",
  "Ranking…",
  "Building edition…",
] as const

interface HeroProps {
  onGenerate: (topics: string[]) => Promise<void>
  loading: boolean
  error: string | null
}

export function Hero({ onGenerate, loading, error }: Readonly<HeroProps>) {
  const [selected, setSelected] = useState<string[]>(() => [...DEFAULT_SELECTED])
  const [statusIndex, setStatusIndex] = useState(0)

  useEffect(() => {
    if (!loading) {
      setStatusIndex(0)
      return
    }
    const id = window.setInterval(() => {
      setStatusIndex((current) => (current + 1) % GENERATE_STATUSES.length)
    }, 900)
    return () => window.clearInterval(id)
  }, [loading])

  function toggleTopic(slug: string) {
    setSelected((current) => {
      if (current.includes(slug)) {
        return current.filter((item) => item !== slug)
      }
      if (current.length >= MAX_TOPICS) return current
      return [...current, slug]
    })
  }

  const canGenerate =
    selected.length >= MIN_TOPICS && selected.length <= MAX_TOPICS && !loading

  return (
    <section className="relative flex min-h-svh items-center overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, color-mix(in oklch, var(--primary) 18%, transparent) 0%, transparent 70%)",
        }}
      />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="max-w-xl">
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Personalized AI &amp; technology newsletters,{" "}
            <span className="text-primary">daily or weekly</span>
          </h1>

          <p className="text-muted-foreground mt-6 text-balance text-lg">
            Astra collects articles from across the web, ranks them against your
            interests, and delivers a briefing that actually matters — every
            morning, every Monday, or both.
          </p>

          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <Button asChild variant="outline" size="lg">
              <Link href="/login">
                Try for free
                <ArrowRight />
              </Link>
            </Button>
            <p className="text-muted-foreground text-xs">
              This is a personal project. No plans to charge for this service.
            </p>
          </div>
        </div>

        <div className="bg-card/80 rounded-2xl border p-6 shadow-sm backdrop-blur-sm">
          <p className="text-xs font-semibold uppercase tracking-wide">
            Try it now
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Pick {MIN_TOPICS}–{MAX_TOPICS} topics. No signup — we&apos;ll rank a
            real weekly edition on this page.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {TOPICS.map((topic) => {
              const isSelected = selected.includes(topic.slug)
              const atMax = selected.length >= MAX_TOPICS && !isSelected
              return (
                <button
                  key={topic.slug}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={atMax}
                  title={topic.description}
                  onClick={() => toggleTopic(topic.slug)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted",
                    atMax && "opacity-50"
                  )}
                >
                  {topic.name}
                </button>
              )
            })}
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <Button
              size="lg"
              disabled={!canGenerate}
              onClick={() => onGenerate(selected)}
              className={cn(
                "relative w-full overflow-hidden sm:w-auto",
                loading && "animate-pulse"
              )}
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Sparkles />
              )}
              {loading
                ? GENERATE_STATUSES[statusIndex]
                : "Generate my newsletter"}
            </Button>
            {error && (
              <p className="text-destructive text-sm" role="alert">
                {error}
              </p>
            )}
            <p className="text-muted-foreground text-xs">
              {selected.length} selected · {MIN_TOPICS}–{MAX_TOPICS} topics
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
