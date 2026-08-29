import { Check } from "lucide-react"

const HIGHLIGHTS = [
  "Per-topic weights, not just on/off switches",
  "Learns from what you open and read",
  "Update your preferences anytime",
] as const

const WEIGHT_PREVIEW = [
  { name: "AI Agents", weight: 5 },
  { name: "LLMs", weight: 4 },
  { name: "MCP", weight: 3 },
  { name: "Cloud", weight: 1 },
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
            The demo above is on/off. After you join, assign each topic a
            weight. Astra uses those signals — combined with your engagement —
            to rank every article just for you.
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
            Topic weights
          </p>
          <ul className="mt-5 space-y-4">
            {WEIGHT_PREVIEW.map((row) => (
              <li key={row.name}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium">{row.name}</span>
                  <span className="text-muted-foreground font-mono text-xs">
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
      </div>
    </section>
  )
}
