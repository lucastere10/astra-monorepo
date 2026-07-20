"use client"

import { useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Mail,
  PanelLeftClose,
  PanelLeftOpen,
  Shield,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react"

import { Avatar, AvatarFallback } from "@workspace/ui/components/avatar"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { LogoutButton } from "@/components/app/logout-button"
import { NavLink } from "@/components/app/nav-link"

interface AppSidebarProps {
  email: string
  initial: string
  isAdmin: boolean
}

export function AppSidebar({ email, initial, isAdmin }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "bg-card/40 hidden h-full min-h-0 shrink-0 flex-col border-r transition-[width] duration-200 md:flex",
        collapsed ? "w-14" : "w-60"
      )}
    >
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b",
          collapsed ? "justify-center px-1" : "justify-between gap-2 px-3"
        )}
      >
        <Link
          href="/dashboard"
          className={cn(
            "flex min-w-0 items-center gap-2",
            collapsed && "justify-center"
          )}
          title="Astra"
        >
          <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md">
            <Sparkles className="size-4" />
          </span>
          {!collapsed && (
            <span className="truncate text-sm font-semibold tracking-tight">
              Astra
            </span>
          )}
        </Link>
        {!collapsed && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse sidebar"
            onClick={() => setCollapsed(true)}
          >
            <PanelLeftClose className="size-4" />
          </Button>
        )}
      </div>

      {collapsed && (
        <div className="flex shrink-0 justify-center border-b py-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Expand sidebar"
            onClick={() => setCollapsed(false)}
          >
            <PanelLeftOpen className="size-4" />
          </Button>
        </div>
      )}

      <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2">
        <NavLink href="/dashboard" collapsed={collapsed} label="Dashboard">
          <LayoutDashboard className="size-4 shrink-0" />
          {!collapsed && "Dashboard"}
        </NavLink>
        <NavLink href="/preferences" collapsed={collapsed} label="Preferences">
          <SlidersHorizontal className="size-4 shrink-0" />
          {!collapsed && "Preferences"}
        </NavLink>
        <NavLink href="/newsletters" collapsed={collapsed} label="Newsletters">
          <Mail className="size-4 shrink-0" />
          {!collapsed && "Newsletters"}
        </NavLink>
        {isAdmin && (
          <NavLink href="/admin" collapsed={collapsed} label="Admin">
            <Shield className="size-4 shrink-0" />
            {!collapsed && "Admin"}
          </NavLink>
        )}
      </nav>

      <div
        className={cn(
          "shrink-0 border-t",
          collapsed ? "p-2" : "p-3"
        )}
      >
        <div
          className={cn(
            "mb-2 flex items-center gap-2",
            collapsed ? "justify-center" : "px-1"
          )}
          title={email}
        >
          <Avatar className="size-7 shrink-0">
            <AvatarFallback>{initial}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <span className="text-muted-foreground truncate text-xs">
              {email}
            </span>
          )}
        </div>
        <LogoutButton collapsed={collapsed} />
      </div>
    </aside>
  )
}
