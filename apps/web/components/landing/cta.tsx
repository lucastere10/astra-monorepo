import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

export function Cta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="bg-card relative overflow-hidden rounded-2xl border px-6 py-16 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(50% 80% at 50% 0%, color-mix(in oklch, var(--primary) 16%, transparent) 0%, transparent 70%)",
          }}
        />
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Start reading what actually matters
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-balance">
          Join Astra and get a personalized technology intelligence
          newsletter, powered by AI.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/login">
              Get started for free
              <ArrowRight />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
