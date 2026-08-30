"use client"

import { Clock, ExternalLink, Loader2 } from "lucide-react"
import { motion, useAnimationControls, useReducedMotion } from "motion/react"
import { useLayoutEffect, type ReactNode } from "react"

import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

import type { DemoPreview } from "@/modules/demo/types"

const EASE = [0.16, 1, 0.3, 1] as const

const PAPER =
  "bg-background dark:bg-card border px-6 py-10 shadow-[0_12px_40px_rgb(0_0_0/0.08)] sm:px-10 dark:shadow-[0_16px_48px_rgb(0_0_0/0.45)]"

interface DemoPreviewCanvasProps {
  preview: DemoPreview | null
  loading: boolean
  error: string | null
  aside?: ReactNode
}

function topicList(names: string[]): string {
  if (names.length === 0) return "your interests"
  if (names.length === 1) return names[0] ?? "your interests"
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`
}

function LoadingState() {
  return (
    <div className={cn(PAPER, "mt-10")}>
      <p className="flex items-center gap-2 text-sm font-medium">
        <Loader2 className="text-primary size-4 animate-spin" />
        Ranking stories for you…
      </p>
      <p className="text-muted-foreground mt-2 text-sm">
        Scoring freshness, topic fit, and diversity.
      </p>
      <div className="mt-10 space-y-6" aria-hidden>
        <div className="bg-muted h-3 w-2/5" />
        <div className="bg-muted h-7 w-4/5" />
        <div className="space-y-2">
          <div className="bg-muted h-2.5 w-full" />
          <div className="bg-muted h-2.5 w-[92%]" />
          <div className="bg-muted h-2.5 w-3/4" />
        </div>
        <div className="border-border/60 space-y-2 border-t pt-6">
          <div className="bg-muted h-2.5 w-full" />
          <div className="bg-muted h-2.5 w-5/6" />
        </div>
        <div className="border-border/60 space-y-2 border-t pt-6">
          <div className="bg-muted h-2.5 w-full" />
          <div className="bg-muted h-2.5 w-2/3" />
        </div>
      </div>
    </div>
  )
}

function PreviewEdition({ preview }: Readonly<{ preview: DemoPreview }>) {
  const reduceMotion = useReducedMotion()
  const skipTravel = reduceMotion !== false
  const paperControls = useAnimationControls()

  useLayoutEffect(() => {
    if (reduceMotion !== false) return
    paperControls.set({ clipPath: "inset(0 0 100% 0)" })
    void paperControls.start({
      clipPath: "inset(0 0 0% 0)",
      transition: { duration: 0.5, ease: EASE },
    })
  }, [reduceMotion, paperControls, preview.previewId])

  return (
    <motion.article
      className={cn(PAPER, "mt-10 overflow-hidden")}
      initial={false}
      animate={paperControls}
    >
      <header className="max-w-prose">
        <p className="text-lg font-semibold tracking-tight">Astra Weekly</p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          {preview.subject}
        </h3>
        {preview.trendingTopic && (
          <p className="text-muted-foreground mt-2 text-sm">
            Trending topic:{" "}
            <span className="text-foreground font-medium">
              {preview.trendingTopic}
            </span>
          </p>
        )}
        <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
          {preview.intro}
        </p>
      </header>

      <motion.div
        className="mt-8 divide-y border-y"
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: skipTravel
              ? { staggerChildren: 0 }
              : { staggerChildren: 0.045, delayChildren: 0.22 },
          },
        }}
      >
        {preview.articles.map((article, index) => (
          <motion.div
            key={`${article.url}-${index}`}
            className="py-6"
            variants={{
              hidden: skipTravel ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 },
              show: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.35, ease: EASE },
              },
            }}
          >
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <span className="font-mono tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              {article.topics.slice(0, 2).map((topic) => (
                <Badge key={topic} variant="secondary" className="py-0">
                  {topic}
                </Badge>
              ))}
            </div>

            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="group mt-2 flex items-start justify-between gap-3"
            >
              <h4 className="group-hover:text-primary font-medium leading-snug transition-colors">
                {article.title}
              </h4>
              <ExternalLink
                aria-hidden
                className="text-muted-foreground size-4 shrink-0"
              />
              <span className="sr-only">(opens in a new tab)</span>
            </a>

            {article.summary && (
              <p className="text-muted-foreground mt-2 max-w-prose text-sm leading-relaxed">
                {article.summary}
              </p>
            )}

            {article.reason && (
              <p className="text-muted-foreground mt-2 max-w-prose text-sm">
                <span className="text-foreground font-medium">
                  Why it matters:{" "}
                </span>
                {article.reason}
              </p>
            )}

            <div className="text-muted-foreground mt-3 flex items-center gap-3 text-xs">
              {article.sourceName && <span>{article.sourceName}</span>}
              {article.readingTimeMin && (
                <span className="flex items-center gap-1">
                  <Clock className="size-3" />
                  {article.readingTimeMin} min read
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <footer className="text-muted-foreground mt-6 text-xs">
        A sample weekly edition. Join to get Daily, Weekly, or both in your
        inbox.
      </footer>
    </motion.article>
  )
}

export function DemoPreviewCanvas({
  preview,
  loading,
  error,
  aside,
}: Readonly<DemoPreviewCanvasProps>) {
  if (!loading && !preview) {
    return null
  }

  let body = <LoadingState />
  if (preview) {
    body = <PreviewEdition key={preview.previewId} preview={preview} />
  }

  return (
    <section
      id="edition"
      className="border-border/60 scroll-mt-16 border-y bg-muted dark:bg-background"
    >
      <div
        className={cn(
          "mx-auto max-w-6xl px-4 py-20 sm:px-6",
          aside && "max-lg:pb-36"
        )}
      >
        <div className="max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Your edition, ranked live
          </h2>
          <p className="text-muted-foreground mt-4 max-w-prose">
            {preview
              ? `This is an edition like the weekly briefing you would receive — ranked for ${topicList(preview.topicNames)}. Daily is available after you join.`
              : "Ranking a weekly briefing from real articles in the corpus."}
          </p>
          {error && !preview ? (
            <p className="text-destructive mt-3 text-sm" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div
          className={cn(
            "mt-2 grid items-start gap-8 lg:justify-center",
            aside
              ? "lg:grid-cols-[minmax(0,42rem)_16rem]"
              : "mx-auto max-w-3xl"
          )}
        >
          <div className="min-w-0">{body}</div>
          {aside ? (
            <aside className="lg:sticky lg:top-20 lg:self-start lg:pt-10">
              <div className="fixed inset-x-4 bottom-4 z-40 lg:static lg:inset-auto lg:bottom-auto lg:z-auto">
                {aside}
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </section>
  )
}
