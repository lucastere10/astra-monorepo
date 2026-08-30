import type { Metadata } from "next"
import { Activity, FileText, Mail, Newspaper, Radio, Users } from "lucide-react"

import { formatRelativeTime } from "@workspace/shared/utils"
import { Badge } from "@workspace/ui/components/badge"

import { getAdminOverview } from "@/modules/admin/admin.service"

function workerBadgeVariant(
  status: string
): "default" | "destructive" | "outline" {
  if (status === "SUCCESS") return "default"
  if (status === "FAILED") return "destructive"
  return "outline"
}

export const metadata: Metadata = {
  title: "Admin overview",
}

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview()

  const stats = [
    { label: "Users", value: String(overview.userCount), icon: Users },
    { label: "Articles", value: String(overview.articleCount), icon: Newspaper },
    {
      label: "Active sources",
      value: `${overview.activeSourceCount}/${overview.sourceCount}`,
      icon: Radio,
    },
    {
      label: "Newsletters sent",
      value: `${overview.sentNewsletterCount}/${overview.newsletterCount}`,
      icon: Mail,
    },
    {
      label: "Analytics events",
      value: String(overview.eventCount),
      icon: Activity,
    },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          System-wide health and activity at a glance.
        </p>
      </header>

      <dl className="grid border-y sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="border-border/60 flex flex-col gap-1 border-b py-5 sm:px-6 sm:first:pl-0"
          >
            <dt className="text-muted-foreground flex items-center justify-between text-sm">
              {stat.label}
              <stat.icon className="size-4" />
            </dt>
            <dd className="text-2xl font-semibold tracking-tight tabular-nums">
              {stat.value}
            </dd>
          </div>
        ))}

        <div className="flex flex-col gap-1 py-5 sm:px-6">
          <dt className="text-muted-foreground flex items-center justify-between text-sm">
            Last worker run
            <FileText className="size-4" />
          </dt>
          {overview.lastWorker ? (
            <dd className="flex flex-col gap-1">
              <span className="flex items-center gap-2 text-base font-semibold">
                {overview.lastWorker.workerName}
                <Badge
                  variant={workerBadgeVariant(overview.lastWorker.status)}
                  className="py-0"
                >
                  {overview.lastWorker.status.toLowerCase()}
                </Badge>
              </span>
              <span className="text-muted-foreground text-xs">
                {formatRelativeTime(overview.lastWorker.startedAt)}
              </span>
            </dd>
          ) : (
            <dd className="text-base font-semibold">No runs yet</dd>
          )}
        </div>
      </dl>
    </div>
  )
}
