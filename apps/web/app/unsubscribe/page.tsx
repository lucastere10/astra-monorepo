import type { Metadata } from "next"
import Link from "next/link"
import { Sparkles } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import { UnsubscribeForm } from "@/components/unsubscribe/unsubscribe-form"
import { lookupUnsubscribeToken } from "@/modules/unsubscribe/service"

export const metadata: Metadata = {
  title: "Unsubscribe",
}

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; token?: string }>
}) {
  const params = await searchParams
  const token = params.t ?? params.token ?? ""
  const user = await lookupUnsubscribeToken(token)

  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="bg-primary/10 text-primary flex size-8 items-center justify-center rounded-md">
          <Sparkles className="size-4" />
        </span>
        <span className="font-semibold tracking-tight">Astra</span>
      </Link>
      <div className="bg-card w-full max-w-sm rounded-xl border p-6 shadow-sm">
        <h1 className="mb-4 text-lg font-semibold tracking-tight">
          Unsubscribe
        </h1>

        {!token || !user ? (
          <div className="flex flex-col gap-3">
            <p className="text-muted-foreground text-sm">
              This unsubscribe link is missing or invalid.
            </p>
            <Button asChild variant="outline">
              <Link href="/login">Sign in to manage email</Link>
            </Button>
          </div>
        ) : (
          <UnsubscribeForm
            token={token}
            email={user.email}
            alreadyOff={!user.autoSendEnabled}
          />
        )}
      </div>
    </div>
  )
}
