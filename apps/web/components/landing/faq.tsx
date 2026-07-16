import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion"
import { BRAND_NAME } from "@workspace/shared/branding"

const FAQS = [
  {
    question: `How is ${BRAND_NAME} different from a normal newsletter?`,
    answer: `${BRAND_NAME} continuously collects and enriches articles with AI, then ranks them for each person based on topics, engagement, and freshness. The newsletter is the delivery format — the product is personalized signal.`,
  },
  {
    question: "How does the personalization actually work?",
    answer:
      "You choose topics and assign weights. A composite engine blends topic affinity, past interactions, global quality score, recency, and diversity. It does not rely solely on LLM prompts.",
  },
  {
    question: "How often will I receive an edition?",
    answer: `By default, ${BRAND_NAME} delivers weekly. You can switch to a daily digest and pick your send time in Preferences.`,
  },
  {
    question: "Where do the articles come from?",
    answer:
      "We collect from a curated set of reputable technology and AI sources via RSS and other collectors. Sources are managed and continuously expanded.",
  },
  {
    question: "Is my data private?",
    answer:
      "Your preferences and engagement are used only to personalize your experience. You can unsubscribe and remove your data whenever you want.",
  },
] as const

export function Faq() {
  return (
    <section id="faq" className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-stone-50 sm:text-4xl">
          Frequently asked questions
        </h2>
      </div>

      <Accordion type="single" collapsible className="mt-10 w-full">
        {FAQS.map((faq) => (
          <AccordionItem
            key={faq.question}
            value={faq.question}
            className="border-white/10"
          >
            <AccordionTrigger className="text-base text-stone-100 hover:no-underline hover:text-amber-200">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-stone-400">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
