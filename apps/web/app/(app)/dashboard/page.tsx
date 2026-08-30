import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Mail, Sparkles, SlidersHorizontal } from "lucide-react"

import { prisma } from "@workspace/database"
import { formatRelativeTime } from "@workspace/shared/utils"
import { Button } from "@workspace/ui/components/button"

import { requireUser } from "@/modules/auth/dal"

export const metadata: Metadata = {
  title: "Dashboard",
}

function topicSummary(count: number): string {
  if (count === 0) return "No topics selected yet."
  if (count === 1) return "You're tracking 1 topic."
  return `You're tracking ${count} topics.`
}

export default async function DashboardPage() {
  const user = await requireUser()

  const [topicCount, newsletterCount, lastNewsletter] = await Promise.all([
    prisma.userPreference.count({ where: { userId: user.id } }),
    prisma.newsletter.count({
      where: { userId: user.id, status: "SENT" },
    }),
    prisma.newsletter.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      select: { id: true, subject: true, status: true, createdAt: true },
    }),
  ])

  const needsOnboarding = topicCount === 0

  const stats = [
    { label: "Active topics", value: String(topicCount) },
    { label: "Newsletters received", value: String(newsletterCount) },
    {
      label: "Last edition",
      value: lastNewsletter
        ? formatRelativeTime(lastNewsletter.createdAt)
        : "None yet",
    },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back{user.name ? `, ${user.name}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Here is the state of your personalized intelligence feed.
        </p>
      </header>

      {needsOnboarding && (
        <div className="bg-muted/40 mb-8 border px-5 py-4">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="text-primary size-4" />
            Finish setting up your feed
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            Pick the topics you care about so we can start personalizing your
            newsletter.
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link href="/preferences">
              Choose topics
              <ArrowRight />
            </Link>
          </Button>
        </div>
      )}

      <dl className="grid border-y sm:grid-cols-3">
        {stats.map((stat, index) => (
          <div
            key={stat.label}
            className={
              index === 0
                ? "py-5 sm:pr-6"
                : "border-t py-5 sm:border-t-0 sm:border-l sm:px-6"
            }
          >
            <dt className="text-muted-foreground text-sm">{stat.label}</dt>
            <dd className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 grid gap-8 border-t pt-8 md:grid-cols-2 md:gap-12">
        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <SlidersHorizontal className="size-4" />
            Your preferences
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {topicSummary(topicCount)}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/preferences">Manage preferences</Link>
          </Button>
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-base font-semibold">
            <Mail className="size-4" />
            Your newsletters
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            {lastNewsletter
              ? lastNewsletter.subject
              : "Your first edition will appear here."}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/newsletters">View history</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
