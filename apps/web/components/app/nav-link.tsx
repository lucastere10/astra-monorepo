"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@workspace/ui/lib/utils"

export function NavLink({
  href,
  children,
  collapsed,
  label,
}: {
  href: string
  children: React.ReactNode
  collapsed?: boolean
  label?: string
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)

  return (
    <Link
      href={href}
      title={collapsed ? label : undefined}
      aria-label={collapsed ? label : undefined}
      className={cn(
        "flex items-center gap-2 rounded-md text-sm transition-colors",
        collapsed ? "justify-center px-2 py-2" : "px-3 py-2",
        isActive
          ? "bg-accent text-accent-foreground font-medium"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
      )}
    >
      {children}
    </Link>
  )
}
