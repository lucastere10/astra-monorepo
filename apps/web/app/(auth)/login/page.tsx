import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { LoginForm } from "@/components/auth/login-form"
import { getCurrentUser } from "@/modules/auth/dal"

export const metadata: Metadata = {
  title: "Sign in",
}

const ERROR_MESSAGES: Record<string, string> = {
  "missing-token": "That sign-in link was incomplete. Please request a new one.",
  "invalid-token": "That sign-in link is invalid or has expired.",
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const user = await getCurrentUser()
  if (user) {
    redirect("/dashboard")
  }

  const { error } = await searchParams
  const errorMessage = error ? ERROR_MESSAGES[error] : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-lg font-semibold">Welcome back</h1>
        <p className="text-muted-foreground text-sm">
          Enter your email to receive a magic sign-in link.
        </p>
      </div>

      {errorMessage && (
        <p className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-center text-sm">
          {errorMessage}
        </p>
      )}

      <LoginForm />

      <p className="text-muted-foreground text-center text-xs">
        No password needed. This is a personal project with no plans to
        charge.
      </p>
    </div>
  )
}
