import { Check } from "lucide-react"

import { TOPICS } from "@workspace/shared/topics"
import { Badge } from "@workspace/ui/components/badge"

const HIGHLIGHTS = [
  "Per-topic weights, not just on/off switches",
  "Learns from what you open and read",
  "Update your preferences anytime",
] as const

export function Personalization() {
  return (
    <section
      id="personalization"
      className="mx-auto max-w-6xl px-4 py-20 sm:px-6"
    >
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Tuned to exactly what you care about
          </h2>
          <p className="text-muted-foreground mt-4 text-balance">
            Select the topics that matter and assign each a weight. Astra
            uses these signals — combined with your engagement — to rank every
            article just for you.
          </p>

          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <span className="bg-primary/10 text-primary mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                  <Check className="size-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-card rounded-xl border p-6">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Available topics
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {TOPICS.map((topic) => (
              <Badge key={topic.slug} variant="secondary" className="py-1">
                {topic.name}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
