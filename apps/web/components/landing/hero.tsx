"use client"

import { motion, useAnimationControls, useReducedMotion } from "motion/react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { Loader2 } from "lucide-react"

import { TOPICS } from "@workspace/shared/topics"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

const MIN_TOPICS = 2
const MAX_TOPICS = 5
const DEFAULT_SELECTED = ["ai-agents", "llms", "mcp"] as const
const INITIAL_TOPIC_SLUGS = new Set([
  "ai-agents",
  "llms",
  "mcp",
  "ai-engineering",
  "cloud",
  "security",
])
const GENERATE_STATUSES = [
  "Collecting…",
  "Ranking…",
  "Building edition…",
] as const
const EASE = [0.16, 1, 0.3, 1] as const

interface HeroProps {
  onGenerate: (topics: string[]) => Promise<void>
  loading: boolean
  error: string | null
}

function topicLabel(slug: string, name: string): string {
  return slug === "mcp" ? "Model Context Protocol" : name
}

export function Hero({ onGenerate, loading, error }: Readonly<HeroProps>) {
  const [selected, setSelected] = useState<string[]>(() => [...DEFAULT_SELECTED])
  const [statusIndex, setStatusIndex] = useState(0)
  const [showAllTopics, setShowAllTopics] = useState(false)
  const reduceMotion = useReducedMotion()
  const copyControls = useAnimationControls()
  const panelControls = useAnimationControls()
  const buttonControls = useAnimationControls()
  const washRef = useRef<HTMLDivElement>(null)
  const [washPaused, setWashPaused] = useState(false)

  useLayoutEffect(() => {
    if (reduceMotion !== false) return

    copyControls.set({ opacity: 0, y: 14 })
    panelControls.set({ opacity: 0, y: 14 })
    buttonControls.set({ scale: 0.98 })

    void copyControls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: EASE },
    })
    void panelControls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: EASE, delay: 0.14 },
    })
    void buttonControls.start({
      scale: 1,
      transition: { duration: 0.4, ease: EASE, delay: 0.42 },
    })
  }, [reduceMotion, copyControls, panelControls, buttonControls])

  useEffect(() => {
    const node = washRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        setWashPaused(!entry?.isIntersecting)
      },
      { threshold: 0.08 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

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

  const visibleTopics = showAllTopics
    ? TOPICS
    : TOPICS.filter((topic) => INITIAL_TOPIC_SLUGS.has(topic.slug))
  const hiddenCount = TOPICS.length - INITIAL_TOPIC_SLUGS.size

  return (
    <section className="relative flex min-h-svh items-center overflow-hidden">
      <div
        aria-hidden
        className="hero-wash pointer-events-none absolute inset-0 -z-10"
        data-paused={washPaused ? "true" : "false"}
        ref={washRef}
      />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div className="max-w-xl" initial={false} animate={copyControls}>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
            Personalized AI &amp; technology newsletters,{" "}
            <span className="text-primary">daily or weekly</span>
          </h1>

          <p className="text-muted-foreground mt-6 max-w-prose text-lg">
            Astra collects articles from across the web, ranks them against your
            interests, and delivers a briefing that actually matters — every
            morning, every Monday, or both.
          </p>

          <p className="text-muted-foreground mt-8 text-sm">
            A personal project. No plans to charge for this service.{" "}
            <Link
              href="/login"
              className="text-foreground underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </motion.div>

        <motion.div
          id="try-now"
          className="scroll-mt-20"
          initial={false}
          animate={panelControls}
        >
          <h2 className="text-lg font-semibold tracking-tight">
            Generate a briefing
          </h2>
          <p className="text-muted-foreground mt-3 text-sm">
            Pick {MIN_TOPICS}–{MAX_TOPICS} {" "} topics. No signup — we&apos;ll rank a
            real weekly edition on this page.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {visibleTopics.map((topic) => {
              const isSelected = selected.includes(topic.slug)
              const atMax = selected.length >= MAX_TOPICS && !isSelected
              const label = topicLabel(topic.slug, topic.name)
              return (
                <button
                  key={topic.slug}
                  type="button"
                  aria-pressed={isSelected}
                  aria-label={`${label}. ${topic.description}`}
                  disabled={atMax}
                  title={
                    atMax
                      ? `Maximum of ${MAX_TOPICS} topics`
                      : topic.description
                  }
                  onClick={() => toggleTopic(topic.slug)}
                  className={cn(
                    "min-h-11 rounded-full border px-3.5 py-2 text-sm transition-colors",
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-muted",
                    atMax && "opacity-50"
                  )}
                >
                  {label}
                </button>
              )
            })}
            {!showAllTopics && hiddenCount > 0 ? (
              <button
                type="button"
                onClick={() => setShowAllTopics(true)}
                className="text-muted-foreground hover:text-foreground min-h-11 rounded-full border border-dashed px-3.5 py-2 text-sm transition-colors"
              >
                More topics
              </button>
            ) : null}
          </div>

          <div className="mt-10">
            <motion.div initial={false} animate={buttonControls}>
              <Button
                size="lg"
                disabled={!canGenerate}
                onClick={() => onGenerate(selected)}
                className="h-11 w-full text-sm"
              >
                {loading ? <Loader2 className="animate-spin" /> : null}
                <span aria-live="polite">
                  {loading
                    ? GENERATE_STATUSES[statusIndex]
                    : "Generate my newsletter"}
                </span>
              </Button>
            </motion.div>
            {error && (
              <p className="text-destructive mt-4 text-sm" role="alert">
                {error}
              </p>
            )}
            <p className="text-muted-foreground mt-4 text-xs">
              {selected.length} selected · {MIN_TOPICS}–{MAX_TOPICS} topics
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
