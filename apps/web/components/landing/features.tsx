import { Moon, Sunrise } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

const CAPABILITIES = [
  {
    index: "01",
    title: "Continuous collection",
    description:
      "Curated sources, watched around the clock. New articles land as they are published — not once a week in a pile.",
    span: "lg:col-span-2",
  },
  {
    index: "02",
    title: "Enrichment",
    description:
      "Each piece is summarized, tagged, and scored for quality before it ever reaches a ranking pass.",
    span: "lg:col-span-2",
  },
  {
    index: "03",
    title: "Personalized ranking",
    description:
      "Topic affinity, engagement, freshness, and diversity — a composite score, not a single LLM prompt.",
    span: "lg:col-span-2",
  },
  {
    index: "04",
    title: "Smart de-duplication",
    description:
      "Similar stories are clustered so you read the signal once. The rest of the echo chamber stays out of the edition.",
    span: "lg:col-span-3",
  },
  {
    index: "05",
    title: "Reading insights",
    description:
      "Estimated reading time and difficulty sit beside every article, so you can pick a five-minute scan or a deeper read.",
    span: "lg:col-span-3",
  },
] as const

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything you need to stay ahead
        </h2>
        <p className="text-muted-foreground mt-4 text-balance">
          Astra is not just another newsletter. It is an intelligence layer
          that learns what you care about — then shows up on the cadence you
          actually want.
        </p>
      </div>

      <div className="mt-12 grid gap-4 lg:grid-cols-6">
        <Card className="lg:col-span-6 overflow-hidden py-0">
          <div className="grid lg:grid-cols-2">
            <CardHeader className="border-border/60 gap-3 py-8 lg:border-r">
              <p className="text-primary font-mono text-xs font-semibold tracking-[0.2em] uppercase">
                Cadence
              </p>
              <CardTitle className="text-2xl sm:text-3xl">
                Daily &amp; Weekly delivery
              </CardTitle>
              <CardDescription className="text-base">
                A short morning digest when the feed is moving, a richer Monday
                briefing when you want the week in one sitting — or both.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-0 p-0">
              <div className="border-border/60 flex flex-col gap-3 border-t p-6 lg:border-t-0">
                <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                  <Sunrise className="size-4" />
                </span>
                <p className="text-sm font-semibold">Astra Daily</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  ~6 stories. Weekdays or every day. Morning, midday, or
                  evening.
                </p>
                <p className="text-primary font-mono text-xs tracking-wide">
                  ~08:00 · digest
                </p>
              </div>
              <div className="border-border/60 flex flex-col gap-3 border-t border-l p-6 lg:border-t-0">
                <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                  <Moon className="size-4" />
                </span>
                <p className="text-sm font-semibold">Astra Weekly</p>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Ten ranked stories, why they matter, and a tool of the week.
                </p>
                <p className="text-primary font-mono text-xs tracking-wide">
                  Monday · briefing
                </p>
              </div>
            </CardContent>
          </div>
        </Card>

        {CAPABILITIES.map((item) => (
          <Card key={item.index} className={cn(item.span, "gap-4")}>
            <CardHeader>
              <span className="text-primary/35 font-mono text-4xl font-bold leading-none">
                {item.index}
              </span>
              <CardTitle className="mt-2">{item.title}</CardTitle>
              <CardDescription className="leading-relaxed">
                {item.description}
              </CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  )
}
