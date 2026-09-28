"use client"

import { useEffect, useLayoutEffect, useState } from "react"
import { Loader2, Mail, X } from "lucide-react"
import { motion, useAnimationControls, useReducedMotion } from "motion/react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

import type { DemoPreview } from "@/modules/demo/types"

type CardStep = "invite" | "sent" | "subscribed"

interface DemoSubscribeCardProps {
  preview: DemoPreview
  onDismiss: () => void
}

export function DemoSubscribeCard({
  preview,
  onDismiss,
}: Readonly<DemoSubscribeCardProps>) {
  const [visible, setVisible] = useState(true)
  const [step, setStep] = useState<CardStep>("invite")
  const [email, setEmail] = useState("")
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reduceMotion = useReducedMotion()
  const cardControls = useAnimationControls()

  useEffect(() => {
    const section = document.getElementById("edition")
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVisible(Boolean(entry?.isIntersecting))
      },
      { threshold: 0.12 }
    )
    observer.observe(section)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    setStep("invite")
    setError(null)
    setPending(false)
  }, [preview.previewId])

  useLayoutEffect(() => {
    if (!visible) return
    if (reduceMotion !== false) return
    cardControls.set({ opacity: 0, y: 10 })
    void cardControls.start({
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.5 },
    })
  }, [visible, reduceMotion, cardControls])

  async function postJson(path: string) {
    setError(null)
    setPending(true)
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ previewId: preview.previewId, email }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
        return false
      }
      return true
    } catch {
      setError("Something went wrong. Please try again.")
      return false
    } finally {
      setPending(false)
    }
  }

  async function handleSend(event: { preventDefault: () => void }) {
    event.preventDefault()
    const ok = await postJson("/api/demo/send")
    if (ok) setStep("sent")
  }

  async function handleSubscribe() {
    const ok = await postJson("/api/demo/subscribe")
    if (ok) setStep("subscribed")
  }

  if (!visible) return null

  return (
    <motion.div
      className="bg-background dark:bg-card relative border p-3"
      initial={false}
      animate={cardControls}
    >
      <button
        type="button"
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground absolute top-2 right-2 flex size-11 items-center justify-center"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>

      {step === "invite" && (
        <form onSubmit={handleSend} className="flex flex-col gap-3 pr-10">
          <p className="text-sm font-semibold leading-snug">
            Want this edition in your inbox?
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            We will send this sample once. Subscribing is optional and happens
            after, if you want it.
          </p>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="demo-email" className="sr-only">
              Email
            </Label>
            <Input
              id="demo-email"
              type="email"
              name="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          {error && (
            <p className="text-destructive text-xs" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" size="sm" disabled={pending || !email}>
            {pending ? <Loader2 className="animate-spin" /> : <Mail />}
            Send this edition
          </Button>
        </form>
      )}

      {step === "sent" && (
        <div className="flex flex-col gap-3 pr-10">
          <p className="text-sm font-semibold leading-snug">
            Sample on its way to {email}
          </p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Want the next one to arrive on its own, every week? Daily is in
            Preferences after you join. No pressure.
          </p>
          {error && (
            <p className="text-destructive text-xs" role="alert">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={handleSubscribe}
            >
              {pending ? <Loader2 className="animate-spin" /> : null}
              Yes, subscribe
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={onDismiss}>
              Not now
            </Button>
          </div>
        </div>
      )}

      {step === "subscribed" && (
        <div className="flex flex-col gap-2 pr-10">
          <p className="text-sm font-semibold leading-snug">Check your email</p>
          <p className="text-muted-foreground text-xs leading-relaxed">
            We sent a sign-in link to {email}. Confirm it to start receiving
            Astra with the topics you just tried.
          </p>
        </div>
      )}
    </motion.div>
  )
}
