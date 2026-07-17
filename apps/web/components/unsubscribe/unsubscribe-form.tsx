"use client"

import { useActionState } from "react"
import Link from "next/link"
import { CheckCircle2, Loader2 } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import {
  confirmUnsubscribe,
  type UnsubscribeFormState,
} from "@/modules/unsubscribe/actions"

interface UnsubscribeFormProps {
  token: string
  email: string
  alreadyOff: boolean
}

export function UnsubscribeForm({
  token,
  email,
  alreadyOff,
}: UnsubscribeFormProps) {
  const [state, action, pending] = useActionState<
    UnsubscribeFormState | undefined,
    FormData
  >(confirmUnsubscribe, undefined)

  const done =
    alreadyOff ||
    (state?.result?.ok === true) ||
    false

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <div className="text-primary flex items-center gap-2 text-sm font-medium">
          <CheckCircle2 className="size-4" />
          You are unsubscribed
        </div>
        <p className="text-muted-foreground text-sm">
          We will no longer send automatic digests to{" "}
          <span className="text-foreground font-medium">{email}</span>.
        </p>
        <p className="text-muted-foreground text-sm">
          Changed your mind?{" "}
          <Link href="/preferences" className="text-foreground underline">
            Manage preferences
          </Link>{" "}
          after signing in.
        </p>
      </div>
    )
  }

  if (state?.result && !state.result.ok) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-destructive text-sm">
          This unsubscribe link is invalid or expired.
        </p>
        <Button asChild variant="outline">
          <Link href="/login">Sign in to manage email</Link>
        </Button>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />
      <p className="text-muted-foreground text-sm">
        Stop all automatic Astra digests for{" "}
        <span className="text-foreground font-medium">{email}</span>?
      </p>
      <Button type="submit" disabled={pending} variant="destructive">
        {pending && <Loader2 className="animate-spin" />}
        Stop all emails
      </Button>
      <p className="text-muted-foreground text-xs">
        Prefer to keep some digests?{" "}
        <Link href="/preferences" className="underline">
          Manage preferences
        </Link>{" "}
        instead.
      </p>
    </form>
  )
}
