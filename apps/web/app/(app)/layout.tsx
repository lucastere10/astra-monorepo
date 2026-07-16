import Link from "next/link"
import {
  LayoutDashboard,
  Mail,
  Shield,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"

import { LogoutButton } from "@/components/app/logout-button"
import { NavLink } from "@/components/app/nav-link"
import { requireUser } from "@/modules/auth/dal"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()
  const initial = (user.name ?? user.email).charAt(0).toUpperCase()

  return (
    <div className="flex min-h-svh">
      <aside className="bg-card/40 hidden w-60 shrink-0 flex-col border-r md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-md">
              <Sparkles className="size-4" />
            </span>
            <span className="text-sm font-semibold tracking-tight">
              Astra
            </span>
          </Link>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          <NavLink href="/dashboard">
            <LayoutDashboard className="size-4" />
            Dashboard
          </NavLink>
          <NavLink href="/preferences">
            <SlidersHorizontal className="size-4" />
            Preferences
          </NavLink>
          <NavLink href="/newsletters">
            <Mail className="size-4" />
            Newsletters
          </NavLink>
          {user.role === "ADMIN" && (
            <NavLink href="/admin">
              <Shield className="size-4" />
              Admin
            </NavLink>
          )}
        </nav>

        <div className="border-t p-3">
          <div className="mb-2 flex items-center gap-2 px-1">
            <Avatar className="size-7">
              <AvatarFallback>{initial}</AvatarFallback>
            </Avatar>
            <span className="text-muted-foreground truncate text-xs">
              {user.email}
            </span>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4 md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-md">
              <Sparkles className="size-4" />
            </span>
            <span className="text-sm font-semibold">Astra</span>
          </Link>
          <LogoutButton />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
