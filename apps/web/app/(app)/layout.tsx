import Link from "next/link"
import { Sparkles } from "lucide-react"

import { AppSidebar } from "@/components/app/app-sidebar"
import { LogoutButton } from "@/components/app/logout-button"
import { requireUser } from "@/modules/auth/dal"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireUser()
  const initial = (user.name ?? user.email).charAt(0).toUpperCase()

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      <AppSidebar
        email={user.email}
        initial={initial}
        isAdmin={user.role === "ADMIN"}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 md:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-md">
              <Sparkles className="size-4" />
            </span>
            <span className="text-sm font-semibold">Astra</span>
          </Link>
          <LogoutButton />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
