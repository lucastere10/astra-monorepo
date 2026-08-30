import type { Metadata } from "next"

import { formatRelativeTime } from "@workspace/shared/utils"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import { ListPagination } from "@/components/list-pagination"
import { toggleSourceActive } from "@/modules/admin/actions"
import { listSources, parsePage } from "@/modules/admin/admin.service"

export const metadata: Metadata = {
  title: "Sources",
}

export default async function AdminSourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const {
    items: sources,
    total,
    totalPages,
    page: currentPage,
  } = await listSources(page)

  const pagination = (
    <ListPagination
      basePath="/admin/sources"
      page={currentPage}
      totalPages={totalPages}
      total={total}
    />
  )

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">News sources</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage where Astra collects articles from.
        </p>
      </header>

      {sources.length > 0 && <div className="mb-4">{pagination}</div>}

      <div className="border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Articles</TableHead>
              <TableHead>Last fetched</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sources.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-10 text-center"
                >
                  No sources configured yet.
                </TableCell>
              </TableRow>
            ) : (
              sources.map((source) => (
                <TableRow key={source.id}>
                  <TableCell className="max-w-0">
                    <p className="truncate font-medium">{source.name}</p>
                    <p className="text-muted-foreground truncate text-xs">
                      {source.url}
                    </p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="py-0">
                      {source.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{source._count.articles}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {source.lastFetchedAt
                      ? formatRelativeTime(source.lastFetchedAt)
                      : "never"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={source.isActive ? "default" : "secondary"}
                      className="py-0"
                    >
                      {source.isActive ? "active" : "paused"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <form action={toggleSourceActive}>
                      <input type="hidden" name="sourceId" value={source.id} />
                      <input
                        type="hidden"
                        name="isActive"
                        value={source.isActive ? "" : "true"}
                      />
                      <Button type="submit" variant="outline" size="xs">
                        {source.isActive ? "Pause" : "Activate"}
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {sources.length > 0 && <div className="mt-4">{pagination}</div>}
    </div>
  )
}
