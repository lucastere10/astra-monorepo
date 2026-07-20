"use client"

import { useState } from "react"
import Link from "next/link"
import {
  BarChart3,
  FileText,
  LayoutGrid,
  Mail,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  Radio,
  Shield,
  Users,
} from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { LogoutButton } from "@/components/app/logout-button"
import { NavLink } from "@/components/app/nav-link"

export function AdminSidebar() {
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
        <div
          className={cn(
            "flex min-w-0 items-center gap-2",
            collapsed && "justify-center"
          )}
          title="Admin"
        >
          <span className="bg-primary/10 text-primary flex size-7 shrink-0 items-center justify-center rounded-md">
            <Shield className="size-4" />
          </span>
          {!collapsed && (
            <span className="truncate text-sm font-semibold tracking-tight">
              Admin
            </span>
          )}
        </div>
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
        <NavLink href="/admin" collapsed={collapsed} label="Overview">
          <LayoutGrid className="size-4 shrink-0" />
          {!collapsed && "Overview"}
        </NavLink>
        <NavLink href="/admin/users" collapsed={collapsed} label="Users">
          <Users className="size-4 shrink-0" />
          {!collapsed && "Users"}
        </NavLink>
        <NavLink href="/admin/sources" collapsed={collapsed} label="Sources">
          <Radio className="size-4 shrink-0" />
          {!collapsed && "Sources"}
        </NavLink>
        <NavLink href="/admin/articles" collapsed={collapsed} label="Articles">
          <Newspaper className="size-4 shrink-0" />
          {!collapsed && "Articles"}
        </NavLink>
        <NavLink
          href="/admin/newsletters"
          collapsed={collapsed}
          label="Newsletters"
        >
          <Mail className="size-4 shrink-0" />
          {!collapsed && "Newsletters"}
        </NavLink>
        <NavLink href="/admin/workers" collapsed={collapsed} label="Workers">
          <FileText className="size-4 shrink-0" />
          {!collapsed && "Workers"}
        </NavLink>
        <NavLink
          href="/admin/analytics"
          collapsed={collapsed}
          label="Analytics"
        >
          <BarChart3 className="size-4 shrink-0" />
          {!collapsed && "Analytics"}
        </NavLink>
      </nav>

      <div className={cn("shrink-0 border-t", collapsed ? "p-2" : "p-3")}>
        <Link
          href="/dashboard"
          title="Back to app"
          className={cn(
            "text-muted-foreground hover:text-foreground mb-1 block py-2 text-sm transition-colors",
            collapsed ? "px-1 text-center" : "px-3"
          )}
        >
          {collapsed ? "←" : "← Back to app"}
        </Link>
        <LogoutButton collapsed={collapsed} />
      </div>
    </aside>
  )
}
