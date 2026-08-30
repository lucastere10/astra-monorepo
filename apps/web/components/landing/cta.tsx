import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

export function Cta() {
  return (
    <section className="border-border/60 border-y bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:px-6">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Start reading what actually matters
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-balance">
          Join Astra for a personalized technology briefing daily, weekly, or
          both.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/login">
              Join Astra
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
