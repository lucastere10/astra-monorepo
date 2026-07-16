"use client"

import { useActionState } from "react"
import { CheckCircle2, Loader2, Mail } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

import { requestMagicLink, type LoginFormState } from "@/modules/auth/actions"

export function LoginForm() {
  const [state, action, pending] = useActionState<
    LoginFormState | undefined,
    FormData
  >(requestMagicLink, undefined)

  if (state?.success) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
          <CheckCircle2 className="size-5" />
        </span>
        <h2 className="text-base font-semibold">Check your email</h2>
        <p className="text-muted-foreground text-sm">
          We sent a sign-in link to{" "}
          <span className="text-foreground font-medium">{state.email}</span>.
          The link is valid for 15 minutes.
        </p>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          aria-invalid={state?.error ? true : undefined}
        />
        {state?.error && (
          <p className="text-destructive text-sm">{state.error}</p>
        )}
      </div>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? (
          <>
            <Loader2 className="animate-spin" />
            Sending link...
          </>
        ) : (
          <>
            <Mail />
            Send magic link
          </>
        )}
      </Button>
    </form>
  )
}
