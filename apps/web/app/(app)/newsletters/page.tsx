import type { Metadata } from "next"
import Link from "next/link"
import { ChevronRight, Mail } from "lucide-react"

import { formatRelativeTime } from "@workspace/shared/utils"
import { Badge } from "@workspace/ui/components/badge"

import { GenerateNewsletterButton } from "@/components/newsletter/generate-button"
import { requireUser } from "@/modules/auth/dal"
import { getUserNewsletters } from "@/modules/newsletter/newsletter.queries"

export const metadata: Metadata = {
  title: "Newsletters",
}

const STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  SENT: "default",
  READY: "secondary",
  GENERATING: "outline",
  PENDING: "outline",
  FAILED: "destructive",
}

export default async function NewslettersPage() {
  const user = await requireUser()
  const newsletters = await getUserNewsletters(user.id)

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Newsletters</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Every personalized edition we have prepared for you.
          </p>
        </div>
        <GenerateNewsletterButton />
      </header>

      {newsletters.length === 0 ? (
        <div className="bg-card flex flex-col items-center gap-3 rounded-xl border p-12 text-center">
          <span className="bg-muted text-muted-foreground flex size-10 items-center justify-center rounded-full">
            <Mail className="size-5" />
          </span>
          <p className="text-sm font-medium">No newsletters yet</p>
          <p className="text-muted-foreground max-w-sm text-sm">
            Once your preferences are set and articles are collected, your
            personalized editions will appear here.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {newsletters.map((newsletter) => (
            <li key={newsletter.id}>
              <Link
                href={`/newsletters/${newsletter.id}`}
                className="bg-card hover:border-primary/40 flex items-center justify-between gap-4 rounded-lg border p-4 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">
                      {newsletter.subject}
                    </p>
                    <Badge
                      variant={STATUS_VARIANT[newsletter.status] ?? "outline"}
                      className="py-0"
                    >
                      {newsletter.status.toLowerCase()}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {newsletter.cadence.toLowerCase()} ·{" "}
                    {newsletter._count.articles} articles ·{" "}
                    {formatRelativeTime(newsletter.createdAt)}
                  </p>
                </div>
                <ChevronRight className="text-muted-foreground size-4 shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
