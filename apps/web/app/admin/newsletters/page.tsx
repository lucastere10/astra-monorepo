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

import { ListPagination } from "@/components/list-pagination"
import {
  listAdminNewsletters,
  parsePage,
} from "@/modules/admin/admin.service"

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

export default async function AdminNewslettersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const {
    items: newsletters,
    total,
    totalPages,
    page: currentPage,
  } = await listAdminNewsletters(page)

  const pagination = (
    <ListPagination
      basePath="/admin/newsletters"
      page={currentPage}
      totalPages={totalPages}
      total={total}
    />
  )

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

      {newsletters.length > 0 && <div className="mb-4">{pagination}</div>}

      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Subject</TableHead>
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
                  <TableCell className="max-w-0">
                    <span className="block truncate font-medium">
                      {newsletter.subject}
                    </span>
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

      {newsletters.length > 0 && <div className="mt-4">{pagination}</div>}
    </div>
  )
}
