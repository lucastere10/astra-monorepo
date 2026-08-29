import { Clock, ExternalLink, Loader2 } from "lucide-react"
import type { ReactNode } from "react"

import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"
import { cn } from "@workspace/ui/lib/utils"

import type { DemoPreview } from "@/modules/demo/types"

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
    <div className="bg-card mt-12 flex flex-col items-center gap-3 rounded-xl border px-6 py-16 text-center shadow-sm">
      <Loader2 className="text-primary size-6 animate-spin" />
      <p className="text-sm font-medium">Ranking stories for you…</p>
      <p className="text-muted-foreground text-xs">
        Scoring freshness, topic fit, and diversity.
      </p>
    </div>
  )
}

function EmptyState({ error }: Readonly<{ error: string | null }>) {
  return (
    <div className="bg-card mt-12 rounded-xl border px-6 py-16 text-center shadow-sm">
      <p className="text-sm font-medium">No edition yet</p>
      <p className="text-muted-foreground mt-2 text-sm">
        {error ??
          "Pick at least two topics above and generate a live preview."}
      </p>
    </div>
  )
}

function PreviewEdition({ preview }: Readonly<{ preview: DemoPreview }>) {
  return (
    <article className="bg-card mt-12 overflow-hidden rounded-xl border shadow-sm">
      <header className="animate-in fade-in slide-in-from-bottom-2 border-b p-6 duration-500">
        <p className="text-primary text-xs font-semibold uppercase tracking-wide">
          Astra Weekly
        </p>
        <h3 className="mt-1 text-xl font-semibold">{preview.subject}</h3>
        {preview.trendingTopic && (
          <p className="text-muted-foreground mt-2 text-xs">
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

      <div className="divide-y">
        {preview.articles.map((article, index) => (
          <div
            key={`${article.url}-${index}`}
            className="animate-in fade-in slide-in-from-bottom-2 p-6 duration-500"
            style={{
              animationDelay: `${120 + index * 70}ms`,
              animationFillMode: "both",
            }}
          >
            <div className="text-muted-foreground flex items-center gap-2 text-xs">
              <span className="text-primary font-mono">
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
              <ExternalLink className="text-muted-foreground size-4 shrink-0" />
            </a>

            {article.summary && (
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {article.summary}
              </p>
            )}

            {article.reason && (
              <p className="text-muted-foreground mt-2 text-sm">
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
          </div>
        ))}
      </div>

      <Separator />
      <footer className="text-muted-foreground p-6 text-xs">
        A sample weekly edition. Join free to get Daily, Weekly, or both in
        your inbox.
      </footer>
    </article>
  )
}

export function DemoPreviewCanvas({
  preview,
  loading,
  error,
  aside,
}: Readonly<DemoPreviewCanvasProps>) {
  let body = <EmptyState error={error} />
  if (loading && !preview) {
    body = <LoadingState />
  } else if (preview) {
    body = <PreviewEdition key={preview.previewId} preview={preview} />
  }

  return (
    <section
      id="try-now"
      className="border-border/60 scroll-mt-16 border-y bg-muted/30"
    >
      <div
        className={cn(
          "mx-auto max-w-6xl px-4 py-20 sm:px-6",
          aside && "max-lg:pb-36"
        )}
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Your edition, ranked live
          </h2>
          <p className="text-muted-foreground mt-4 text-balance">
            {preview
              ? `This is an edition like the weekly briefing you would receive — ranked for ${topicList(preview.topicNames)}. Daily is available after you join.`
              : "Choose topics above and generate a weekly briefing from real articles in the corpus."}
          </p>
        </div>

        <div
          className={cn(
            "mt-0 grid items-start gap-8 lg:justify-center",
            aside
              ? "lg:grid-cols-[minmax(0,40rem)_18rem]"
              : "mx-auto max-w-3xl"
          )}
        >
          <div className="min-w-0">{body}</div>
          {aside ? (
            <aside className="lg:sticky lg:top-20 lg:self-start">
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
