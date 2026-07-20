export const DEFAULT_PAGE_SIZE = 20

export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export function parsePage(value?: string): number {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 1) return 1
  return Math.floor(n)
}

export function paginateMeta(total: number, page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(page, totalPages)
  return {
    total,
    page: safePage,
    pageSize,
    totalPages,
    skip: (safePage - 1) * pageSize,
  }
}
