import type { Metadata } from "next"

import { formatRelativeTime } from "@workspace/shared/utils"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import { setUserRole } from "@/modules/admin/actions"
import { listUsers } from "@/modules/admin/admin.service"

export const metadata: Metadata = {
  title: "Users",
}

export default async function AdminUsersPage() {
  const users = await listUsers()

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {users.length} most recent users.
        </p>
      </header>

      <div className="bg-card rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Topics</TableHead>
              <TableHead>Newsletters</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  {user.email}
                  {user.name && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      {user.name}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={user.role === "ADMIN" ? "default" : "secondary"}
                    className="py-0"
                  >
                    {user.role.toLowerCase()}
                  </Badge>
                </TableCell>
                <TableCell>{user._count.preferences}</TableCell>
                <TableCell>{user._count.newsletters}</TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {formatRelativeTime(user.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <form action={setUserRole}>
                    <input type="hidden" name="userId" value={user.id} />
                    <input
                      type="hidden"
                      name="role"
                      value={user.role === "ADMIN" ? "USER" : "ADMIN"}
                    />
                    <Button type="submit" variant="outline" size="xs">
                      {user.role === "ADMIN" ? "Demote" : "Promote"}
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
