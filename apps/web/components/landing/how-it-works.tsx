const STEPS = [
  {
    step: "01",
    title: "Pick your topics",
    description:
      "Choose from topics like AI Agents, LLMs, Cloud or Security and set how much each one matters with adjustable weights.",
  },
  {
    step: "02",
    title: "AI does the work",
    description:
      "Our worker collects, summarizes and scores articles continuously, building a fresh, enriched knowledge base every day.",
  },
  {
    step: "03",
    title: "Get your newsletter",
    description:
      "Choose a weekly briefing, an optional daily digest, or both — top articles, why they matter, and a tool of the week.",
  },
] as const

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="border-border/60 border-y bg-muted/30"
    >
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            How it works
          </h2>
          <p className="text-muted-foreground mt-4 text-balance">
            From thousands of articles to a single, personalized read.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {STEPS.map((item) => (
            <div key={item.step} className="relative">
              <span className="text-primary/30 font-mono text-5xl font-bold">
                {item.step}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
