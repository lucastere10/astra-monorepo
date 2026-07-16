import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Clock, ExternalLink } from "lucide-react"

import { formatRelativeTime } from "@workspace/shared/utils"
import { brandingLabel, type NewsletterCadence } from "@workspace/shared/cadence"
import { BRAND_NAME } from "@workspace/shared/branding"
import { Badge } from "@workspace/ui/components/badge"
import { Separator } from "@workspace/ui/components/separator"

import { requireUser } from "@/modules/auth/dal"
import { getNewsletterForUser } from "@/modules/newsletter/newsletter.queries"
import { SendNewsletterButton } from "@/components/newsletter/send-button"

export const metadata: Metadata = {
  title: "Newsletter",
}

export default async function NewsletterDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireUser()
  const { id } = await params
  const newsletter = await getNewsletterForUser(id, user.id)

  if (!newsletter) {
    notFound()
  }

  const canSend =
    newsletter.status !== "SENT" &&
    newsletter.status !== "GENERATING" &&
    newsletter.status !== "PENDING"

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          href="/newsletters"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to newsletters
        </Link>
        <SendNewsletterButton
          newsletterId={newsletter.id}
          disabled={!canSend}
        />
      </div>

      <article className="bg-card overflow-hidden rounded-xl border">
        <header className="border-b p-6">
          <p className="text-primary text-xs font-semibold uppercase tracking-wide">
            {brandingLabel(newsletter.cadence as NewsletterCadence)}
          </p>
          <h1 className="mt-1 text-xl font-semibold">{newsletter.subject}</h1>
          <p className="text-muted-foreground mt-2 text-xs">
            {formatRelativeTime(newsletter.createdAt)} ·{" "}
            {newsletter.articles.length} articles
            {newsletter.status === "SENT" && newsletter.sentAt
              ? ` · Sent ${formatRelativeTime(newsletter.sentAt)}`
              : null}
          </p>
          {newsletter.intro && (
            <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
              {newsletter.intro}
            </p>
          )}
        </header>

        <div className="divide-y">
          {newsletter.articles.map((item) => (
            <div key={item.id} className="p-6">
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <span className="text-primary font-mono">
                  {String(item.rank).padStart(2, "0")}
                </span>
                {item.article.topics.slice(0, 2).map((t) => (
                  <Badge key={t.topic.name} variant="secondary" className="py-0">
                    {t.topic.name}
                  </Badge>
                ))}
              </div>

              <a
                href={item.trackedUrl ?? item.article.url}
                target="_blank"
                rel="noreferrer"
                className="group mt-2 flex items-start justify-between gap-3"
              >
                <h2 className="group-hover:text-primary font-medium leading-snug transition-colors">
                  {item.article.title}
                </h2>
                <ExternalLink className="text-muted-foreground size-4 shrink-0" />
              </a>

              {item.article.summary && (
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {item.article.summary}
                </p>
              )}

              {item.reason && (
                <p className="text-muted-foreground mt-2 text-sm">
                  <span className="text-foreground font-medium">
                    Why it matters:{" "}
                  </span>
                  {item.reason}
                </p>
              )}

              <div className="text-muted-foreground mt-3 flex items-center gap-3 text-xs">
                {item.article.source?.name && (
                  <span>{item.article.source.name}</span>
                )}
                {item.article.readingTimeMin && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3" />
                    {item.article.readingTimeMin} min read
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <Separator />
        <footer className="text-muted-foreground p-6 text-xs">
          You are receiving {BRAND_NAME} because you subscribed with{" "}
          {user.email}.
        </footer>
      </article>
    </div>
  )
}
