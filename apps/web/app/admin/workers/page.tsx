import type { Metadata } from "next"

import { formatRelativeTime } from "@workspace/shared/utils"
import { Badge } from "@workspace/ui/components/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"

import { listWorkerExecutions } from "@/modules/admin/admin.service"

export const metadata: Metadata = {
  title: "Worker executions",
}

function duration(start: Date, end: Date | null): string {
  if (!end) return "running"
  const seconds = Math.round((end.getTime() - start.getTime()) / 1000)
  if (seconds < 60) return `${seconds}s`
  return `${Math.round(seconds / 60)}m`
}

export default async function AdminWorkersPage() {
  const executions = await listWorkerExecutions()

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">
          Worker executions
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Observe the collection and enrichment pipeline.
        </p>
      </header>

      <div className="bg-card rounded-xl border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Started</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {executions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-10 text-center"
                >
                  No worker runs recorded yet.
                </TableCell>
              </TableRow>
            ) : (
              executions.map((execution) => (
                <TableRow key={execution.id}>
                  <TableCell className="font-medium">
                    {execution.workerName}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        execution.status === "SUCCESS"
                          ? "default"
                          : execution.status === "FAILED"
                            ? "destructive"
                            : "outline"
                      }
                      className="py-0"
                    >
                      {execution.status.toLowerCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>{execution.itemsProcessed}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {duration(execution.startedAt, execution.finishedAt)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {formatRelativeTime(execution.startedAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
