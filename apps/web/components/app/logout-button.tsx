import { LogOut } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import { logout } from "@/modules/auth/actions"

export function LogoutButton() {
  return (
    <form action={logout}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-muted-foreground w-full justify-start"
      >
        <LogOut />
        Sign out
      </Button>
    </form>
  )
}
