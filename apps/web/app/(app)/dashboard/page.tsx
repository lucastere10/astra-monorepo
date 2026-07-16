import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, Mail, Sparkles, SlidersHorizontal } from "lucide-react"

import { prisma } from "@workspace/database"
import { formatRelativeTime } from "@workspace/shared/utils"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { requireUser } from "@/modules/auth/dal"

export const metadata: Metadata = {
  title: "Dashboard",
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
        <Card className="border-primary/30 bg-primary/5 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="text-primary size-4" />
              Finish setting up your feed
            </CardTitle>
            <CardDescription>
              Pick the topics you care about so we can start personalizing your
              newsletter.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild size="sm">
              <Link href="/preferences">
                Choose topics
                <ArrowRight />
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Active topics</CardDescription>
            <CardTitle className="text-3xl">{topicCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Newsletters received</CardDescription>
            <CardTitle className="text-3xl">{newsletterCount}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Last edition</CardDescription>
            <CardTitle className="text-base">
              {lastNewsletter
                ? formatRelativeTime(lastNewsletter.createdAt)
                : "None yet"}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <SlidersHorizontal className="size-4" />
              Your preferences
            </CardTitle>
            <CardDescription>
              {topicCount > 0
                ? `You're tracking ${topicCount} topic${topicCount === 1 ? "" : "s"}.`
                : "No topics selected yet."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/preferences">Manage preferences</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="size-4" />
              Your newsletters
            </CardTitle>
            <CardDescription>
              {lastNewsletter
                ? lastNewsletter.subject
                : "Your first edition will appear here."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/newsletters">View history</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
