import type { Metadata } from "next"
import { Activity, FileText, Mail, Newspaper, Radio, Users } from "lucide-react"

import { formatRelativeTime } from "@workspace/shared/utils"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

import { getAdminOverview } from "@/modules/admin/admin.service"

export const metadata: Metadata = {
  title: "Admin overview",
}

export default async function AdminOverviewPage() {
  const overview = await getAdminOverview()

  const stats = [
    { label: "Users", value: overview.userCount, icon: Users },
    { label: "Articles", value: overview.articleCount, icon: Newspaper },
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
    { label: "Analytics events", value: overview.eventCount, icon: Activity },
  ]

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          System-wide health and activity at a glance.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription>{stat.label}</CardDescription>
                <stat.icon className="text-muted-foreground size-4" />
              </div>
              <CardTitle className="text-3xl">{stat.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardDescription>Last worker run</CardDescription>
              <FileText className="text-muted-foreground size-4" />
            </div>
            {overview.lastWorker ? (
              <div className="flex flex-col gap-1">
                <CardTitle className="flex items-center gap-2 text-base">
                  {overview.lastWorker.workerName}
                  <Badge
                    variant={
                      overview.lastWorker.status === "SUCCESS"
                        ? "default"
                        : overview.lastWorker.status === "FAILED"
                          ? "destructive"
                          : "outline"
                    }
                    className="py-0"
                  >
                    {overview.lastWorker.status.toLowerCase()}
                  </Badge>
                </CardTitle>
                <p className="text-muted-foreground text-xs">
                  {formatRelativeTime(overview.lastWorker.startedAt)}
                </p>
              </div>
            ) : (
              <CardTitle className="text-base">No runs yet</CardTitle>
            )}
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
