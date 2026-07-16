import {
  Brain,
  Filter,
  Gauge,
  Mail,
  Radar,
  SlidersHorizontal,
} from "lucide-react"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

const FEATURES = [
  {
    icon: Radar,
    title: "Continuous collection",
    description:
      "We monitor curated sources around the clock, capturing new articles as they are published.",
  },
  {
    icon: Brain,
    title: "AI enrichment",
    description:
      "Every article is summarized, tagged with topics and keywords, and scored for quality.",
  },
  {
    icon: SlidersHorizontal,
    title: "Personalized ranking",
    description:
      "A composite engine blends topic affinity, engagement, freshness and diversity — not just LLM prompts.",
  },
  {
    icon: Filter,
    title: "Smart de-duplication",
    description:
      "Similar stories are clustered so you read the signal once, without the noise.",
  },
  {
    icon: Gauge,
    title: "Reading insights",
    description:
      "Estimated reading time and difficulty help you plan what to read and when.",
  },
  {
    icon: Mail,
    title: "Weekly delivery",
    description:
      "A beautifully formatted newsletter lands in your inbox, tuned to your preferences.",
  },
] as const

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Everything you need to stay ahead
        </h2>
        <p className="text-muted-foreground mt-4 text-balance">
          Astra is not just another newsletter. It is an intelligence
          platform that learns what you care about.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <Card key={feature.title} className="gap-3">
            <CardHeader>
              <span className="bg-primary/10 text-primary mb-2 flex size-10 items-center justify-center rounded-lg">
                <feature.icon className="size-5" />
              </span>
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription>{feature.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  )
}
