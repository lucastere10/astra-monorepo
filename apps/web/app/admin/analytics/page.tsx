import type { Metadata } from "next"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { getAnalyticsSummary } from "@/modules/admin/admin.service"

export const metadata: Metadata = {
  title: "Analytics",
}

function labelFor(type: string): string {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export default async function AdminAnalyticsPage() {
  const summary = await getAnalyticsSummary()
  const max = Math.max(1, ...summary.byType.map((row) => row.count))

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Engagement events captured across the platform.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardDescription>Total events</CardDescription>
          <CardTitle className="text-3xl">{summary.total}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {summary.byType.length === 0 ? (
            <p className="text-muted-foreground text-sm">No events yet.</p>
          ) : (
            summary.byType.map((row) => (
              <div key={row.type} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>{labelFor(row.type)}</span>
                  <span className="text-muted-foreground font-mono text-xs">
                    {row.count}
                  </span>
                </div>
                <div className="bg-muted h-2 overflow-hidden rounded-full">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${(row.count / max) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
