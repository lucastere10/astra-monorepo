import type { Metadata } from "next"
import { Search } from "lucide-react"

import { formatRelativeTime } from "@workspace/shared/utils"
import { Button } from "@workspace/ui/components/button"
import { Input } from "@workspace/ui/components/input"
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
  parsePage,
  searchArticles,
} from "@/modules/admin/admin.service"

export const metadata: Metadata = {
  title: "Articles",
}

export default async function AdminArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>
}) {
  const { q, page: pageParam } = await searchParams
  const page = parsePage(pageParam)
  const { items: articles, total, totalPages, page: currentPage } =
    await searchArticles(q, page)

  const pagination = (
    <ListPagination
      basePath="/admin/articles"
      page={currentPage}
      totalPages={totalPages}
      total={total}
      searchParams={{ q }}
    />
  )

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Collected articles
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Search and inspect enriched articles.
        </p>
      </header>

      <form className="mb-4 flex gap-2" action="/admin/articles">
        <div className="relative flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Search by title or summary..."
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      {articles.length > 0 && <div className="mb-4">{pagination}</div>}

      <div className="bg-card rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">Title</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Topics</TableHead>
              <TableHead>Collected</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-10 text-center"
                >
                  No articles found.
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="max-w-0">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:text-primary block truncate font-medium"
                    >
                      {article.title}
                    </a>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {article.source?.name ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {article.globalScore.toFixed(2)}
                  </TableCell>
                  <TableCell>{article._count.topics}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatRelativeTime(article.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {articles.length > 0 && <div className="mt-4">{pagination}</div>}
    </div>
  )
}
