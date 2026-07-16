import { Cta } from "@/components/landing/cta"
import { ExampleNewsletter } from "@/components/landing/example-newsletter"
import { Faq } from "@/components/landing/faq"
import { Features } from "@/components/landing/features"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { Personalization } from "@/components/landing/personalization"

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Personalization />
      <ExampleNewsletter />
      <Faq />
      <Cta />
    </>
  )
}
