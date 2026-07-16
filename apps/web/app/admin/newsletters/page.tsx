import type { Metadata } from "next"

import { formatRelativeTime } from "@workspace/shared/utils"
import { Badge } from "@workspace/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import { listAdminNewsletters } from "@/modules/admin/admin.service"

export const metadata: Metadata = {
  title: "Newsletter editions",
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

export default async function AdminNewslettersPage() {
  const newsletters = await listAdminNewsletters()

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Newsletter editions
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          All generated editions across users.
        </p>
      </header>

      <div className="bg-card rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Articles</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {newsletters.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-10 text-center"
                >
                  No newsletters generated yet.
                </TableCell>
              </TableRow>
            ) : (
              newsletters.map((newsletter) => (
                <TableRow key={newsletter.id}>
                  <TableCell className="max-w-sm truncate font-medium">
                    {newsletter.subject}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {newsletter.user.email}
                  </TableCell>
                  <TableCell>{newsletter._count.articles}</TableCell>
                  <TableCell>
                    <Badge
                      variant={STATUS_VARIANT[newsletter.status] ?? "outline"}
                      className="py-0"
                    >
                      {newsletter.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatRelativeTime(newsletter.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
