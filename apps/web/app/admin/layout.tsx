import { AdminSidebar } from "@/components/app/admin-sidebar"
import { requireAdmin } from "@/modules/auth/dal"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="fixed inset-0 flex overflow-hidden">
      <AdminSidebar />
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
