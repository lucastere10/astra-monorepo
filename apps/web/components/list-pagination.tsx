import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

function buildHref(
  basePath: string,
  page: number,
  searchParams?: Record<string, string | undefined>
): string {
  const params = new URLSearchParams()
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value) params.set(key, value)
    }
  }
  if (page > 1) params.set("page", String(page))
  const qs = params.toString()
  return qs ? `${basePath}?${qs}` : basePath
}

export function ListPagination({
  basePath,
  page,
  totalPages,
  total,
  searchParams,
  className,
}: {
  basePath: string
  page: number
  totalPages: number
  total: number
  searchParams?: Record<string, string | undefined>
  className?: string
}) {
  if (total === 0) return null

  const prevDisabled = page <= 1
  const nextDisabled = page >= totalPages

  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="text-muted-foreground text-xs">
        Page {page} of {totalPages} · {total} item{total === 1 ? "" : "s"}
      </p>
      <div className="flex items-center gap-2">
        {prevDisabled ? (
          <Button type="button" variant="outline" size="sm" disabled>
            <ChevronLeft className="size-3.5" />
            Previous
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={buildHref(basePath, page - 1, searchParams)}>
              <ChevronLeft className="size-3.5" />
              Previous
            </Link>
          </Button>
        )}
        {nextDisabled ? (
          <Button type="button" variant="outline" size="sm" disabled>
            Next
            <ChevronRight className="size-3.5" />
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={buildHref(basePath, page + 1, searchParams)}>
              Next
              <ChevronRight className="size-3.5" />
            </Link>
          </Button>
        )}
      </div>
    </div>
  )
}

/** @deprecated Use ListPagination */
export const AdminPagination = ListPagination
