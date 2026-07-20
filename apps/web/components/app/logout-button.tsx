import { LogOut } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import { logout } from "@/modules/auth/actions"

export function LogoutButton({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <form action={logout}>
      <Button
        type="submit"
        variant="ghost"
        size={collapsed ? "icon" : "sm"}
        className={
          collapsed
            ? "text-muted-foreground w-full"
            : "text-muted-foreground w-full justify-start"
        }
        title={collapsed ? "Sign out" : undefined}
        aria-label={collapsed ? "Sign out" : undefined}
      >
        <LogOut />
        {!collapsed && "Sign out"}
      </Button>
    </form>
  )
}
