import { Clock, ExternalLink } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"

const SAMPLE_ARTICLES = [
  {
    title: "Open-weight models close the gap with frontier LLMs",
    source: "MIT Technology Review",
    topic: "Open Source AI",
    readingTime: 6,
    why: "Signals a shift toward self-hostable models for production workloads.",
  },
  {
    title: "The new wave of AI agents that actually ship code",
    source: "TechCrunch",
    topic: "AI Agents",
    readingTime: 4,
    why: "Agentic tooling is moving from demos to dependable developer workflows.",
  },
  {
    title: "MCP becomes the default protocol for tool integrations",
    source: "Hacker News",
    topic: "MCP",
    readingTime: 5,
    why: "Standardizing tool access reduces glue code across the ecosystem.",
  },
] as const

export function ExampleNewsletter() {
  return (
    <section className="border-border/60 border-y bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            See a sample edition
          </h2>
          <p className="text-muted-foreground mt-4 text-balance">
            A glimpse of what a personalized Astra newsletter looks like.
          </p>
        </div>

        <div className="bg-card mt-12 overflow-hidden rounded-xl border shadow-sm">
          <div className="border-b p-6">
            <p className="text-primary text-xs font-semibold uppercase tracking-wide">
              Astra Weekly
            </p>
            <h3 className="mt-1 text-xl font-semibold">
              Your top stories in AI &amp; technology
            </h3>
            <p className="text-muted-foreground mt-2 text-sm">
              Hand-picked and ranked for you. Here is what matters most this
              week.
            </p>
          </div>

          <div className="divide-y">
            {SAMPLE_ARTICLES.map((article, index) => (
              <div key={article.title} className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-muted-foreground flex items-center gap-2 text-xs">
                      <span className="text-primary font-mono">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <Badge variant="secondary" className="py-0">
                        {article.topic}
                      </Badge>
                    </div>
                    <h4 className="mt-2 font-medium leading-snug">
                      {article.title}
                    </h4>
                    <p className="text-muted-foreground mt-1 text-sm">
                      <span className="font-medium">Why it matters: </span>
                      {article.why}
                    </p>
                    <div className="text-muted-foreground mt-3 flex items-center gap-3 text-xs">
                      <span>{article.source}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {article.readingTime} min read
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="text-muted-foreground size-4 shrink-0" />
                </div>
              </div>
            ))}
          </div>

          <Separator />
          <div className="text-muted-foreground p-6 text-xs">
            Tool of the week, trending topics and more in every edition.
          </div>
        </div>
      </div>
    </section>
  )
}
