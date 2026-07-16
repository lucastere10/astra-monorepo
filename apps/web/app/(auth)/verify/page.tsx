import type { Metadata } from "next"
import Link from "next/link"
import { MailCheck } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

export const metadata: Metadata = {
  title: "Check your email",
}

export default function VerifyPage() {
  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
        <MailCheck className="size-5" />
      </span>
      <div className="flex flex-col gap-1">
        <h1 className="text-base font-semibold">Check your email</h1>
        <p className="text-muted-foreground text-sm">
          We sent you a secure sign-in link. Open it on this device to continue.
          The link is valid for 15 minutes.
        </p>
      </div>
      <Button asChild variant="outline" size="sm">
        <Link href="/login">Back to sign in</Link>
      </Button>
    </div>
  )
}
