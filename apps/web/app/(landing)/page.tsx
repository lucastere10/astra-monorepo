import { Cta } from "@/components/landing/cta"
import { Faq } from "@/components/landing/faq"
import { Features } from "@/components/landing/features"
import { HowItWorks } from "@/components/landing/how-it-works"
import { LandingDemo } from "@/components/landing/landing-demo"
import { Personalization } from "@/components/landing/personalization"

export default function LandingPage() {
  return (
    <>
      <LandingDemo />
      <Features />
      <HowItWorks />
      <Personalization />
      <Faq />
      <Cta />
    </>
  )
}
