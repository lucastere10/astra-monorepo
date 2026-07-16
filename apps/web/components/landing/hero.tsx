import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, color-mix(in oklch, var(--primary) 18%, transparent) 0%, transparent 70%)",
        }}
      />
      <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32">
        <Badge variant="outline" className="mb-6 gap-1.5 py-1">
          <Sparkles className="size-3" />
          Powered by AI
        </Badge>

        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">
          Personalized AI &amp; technology newsletters,
          <span className="text-primary"> delivered weekly</span>
        </h1>

        <p className="text-muted-foreground mt-6 max-w-2xl text-balance text-lg">
          Astra continuously collects articles from across the web,
          enriches them with AI, and ranks everything against your interests —
          so your inbox gets a newsletter that actually matters to you.
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login">
              Start for free
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="#how-it-works">See how it works</Link>
          </Button>
        </div>

        <p className="text-muted-foreground mt-6 text-xs">
          No spam. Curated technology intelligence. Unsubscribe anytime.
        </p>
      </div>
    </section>
  )
}
