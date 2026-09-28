"use client"

import { useEffect, useRef } from "react"
import { Moon, Sunrise } from "lucide-react"
import { motion, useAnimationControls, useReducedMotion } from "motion/react"

const EASE = [0.16, 1, 0.3, 1] as const

const CAPABILITIES = [
  {
    title: "Continuous collection",
    description:
      "Curated sources, watched around the clock. New articles land as they are published — not once a week in a pile.",
  },
  {
    title: "Enrichment",
    description:
      "Each piece is summarized, tagged, and scored for quality before it ever reaches a ranking pass.",
  },
  {
    title: "Personalized ranking",
    description:
      "Topic affinity, engagement, freshness, and diversity — a composite score, not a single LLM prompt.",
  },
  {
    title: "Smart de-duplication",
    description:
      "Similar stories are clustered so you read the signal once. The rest of the echo chamber stays out of the edition.",
  },
  {
    title: "Reading insights",
    description:
      "Estimated reading time and difficulty sit beside every article, so you can pick a five-minute scan or a deeper read.",
  },
] as const

export function Features() {
  const reduceMotion = useReducedMotion()
  const splitRef = useRef<HTMLDivElement>(null)
  const splitControls = useAnimationControls()

  useEffect(() => {
    if (reduceMotion !== false) return
    const node = splitRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return
        if (entry.isIntersecting) {
          void splitControls.start({
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, ease: EASE },
          })
          observer.disconnect()
          return
        }
        splitControls.set({ opacity: 0.35, y: 18 })
      },
      { threshold: 0.4 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [reduceMotion, splitControls])

  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Daily digest, weekly briefing
        </h2>
        <p className="text-muted-foreground mt-4 max-w-prose">
          A short morning read when the feed is moving, a richer Monday sitting
          when you want the week in one place — or both.
        </p>
      </div>

      <motion.div
        ref={splitRef}
        className="mt-12 grid border-y sm:grid-cols-2"
        initial={false}
        animate={splitControls}
      >
        <div className="flex flex-col gap-3 border-b py-8 sm:border-r sm:border-b-0 sm:pr-10 sm:pl-0">
          <Sunrise className="text-primary size-4" />
          <p className="text-lg font-semibold tracking-tight">Astra Daily</p>
          <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
            6 stories. Weekdays or every day. Morning, midday, or evening.
          </p>
          <p className="text-muted-foreground font-mono text-xs tracking-wide">
            08:00 · digest
          </p>
        </div>
        <div className="flex flex-col gap-3 py-8 sm:pl-10">
          <Moon className="text-primary size-4" />
          <p className="text-lg font-semibold tracking-tight">Astra Weekly</p>
          <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
            Ten ranked stories, why they matter, and a tool of the week.
          </p>
          <p className="text-muted-foreground font-mono text-xs tracking-wide">
            Monday · briefing
          </p>
        </div>
      </motion.div>

      <ul className="mt-16 grid gap-x-12 gap-y-10 sm:grid-cols-2">
        {CAPABILITIES.map((item, index) => (
          <li key={item.title} className="max-w-prose">
            <p className="text-muted-foreground font-mono text-xs tabular-nums">
              {String(index + 1).padStart(2, "0")}
            </p>
            <h3 className="mt-2 text-base font-semibold">{item.title}</h3>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {item.description}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
