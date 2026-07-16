import Link from "next/link"
import {
  BarChart3,
  FileText,
  LayoutGrid,
  Mail,
  Newspaper,
  Radio,
  Shield,
  Users,
} from "lucide-react"

import { NavLink } from "@/components/app/nav-link"
import { LogoutButton } from "@/components/app/logout-button"
import { requireAdmin } from "@/modules/auth/dal"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="flex min-h-svh">
      <aside className="bg-card/40 hidden w-60 shrink-0 flex-col border-r md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-md">
            <Shield className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Admin</span>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          <NavLink href="/admin">
            <LayoutGrid className="size-4" />
            Overview
          </NavLink>
          <NavLink href="/admin/users">
            <Users className="size-4" />
            Users
          </NavLink>
          <NavLink href="/admin/sources">
            <Radio className="size-4" />
            Sources
          </NavLink>
          <NavLink href="/admin/articles">
            <Newspaper className="size-4" />
            Articles
          </NavLink>
          <NavLink href="/admin/newsletters">
            <Mail className="size-4" />
            Newsletters
          </NavLink>
          <NavLink href="/admin/workers">
            <FileText className="size-4" />
            Workers
          </NavLink>
          <NavLink href="/admin/analytics">
            <BarChart3 className="size-4" />
            Analytics
          </NavLink>
        </nav>

        <div className="border-t p-3">
          <Link
            href="/dashboard"
            className="text-muted-foreground hover:text-foreground mb-1 block px-3 py-2 text-sm transition-colors"
          >
            ← Back to app
          </Link>
          <LogoutButton />
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  )
}
