import { Check } from "lucide-react"

const HIGHLIGHTS = [
  "Per-topic weights, not just on/off switches",
  "Learns from what you open and read",
  "Update your preferences anytime",
] as const

const WEIGHT_PREVIEW = [
  { name: "AI Agents", weight: 5 },
  { name: "LLMs", weight: 4 },
  { name: "Model Context Protocol", weight: 3 },
  { name: "Cloud", weight: 1 },
] as const

export function Personalization() {
  return (
    <section
      id="personalization"
      className="mx-auto max-w-6xl px-4 py-20 sm:px-6"
    >
      <div className="grid items-start gap-12 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Tuned to exactly what you care about
          </h2>
          <p className="text-muted-foreground mt-4 max-w-prose">
            The demo above is on/off. After you join, assign each topic a
            weight. Astra uses those signals — combined with your engagement —
            to rank every article just for you.
          </p>

          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm">
                <Check className="text-primary mt-0.5 size-4 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <ul className="space-y-5 border-t pt-8 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
          {WEIGHT_PREVIEW.map((row) => (
            <li key={row.name}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="font-medium">{row.name}</span>
                <span className="text-muted-foreground font-mono text-xs tabular-nums">
                  {row.weight}/5
                </span>
              </div>
              <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${(row.weight / 5) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
