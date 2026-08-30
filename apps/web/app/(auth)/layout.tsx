import Link from "next/link"
import { Sparkles } from "lucide-react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-4">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="bg-primary/10 text-primary flex size-8 items-center justify-center">
          <Sparkles className="size-4" />
        </span>
        <span className="font-semibold tracking-tight">Astra</span>
      </Link>
      <div className="bg-card w-full max-w-sm rounded-none border p-6 shadow-none">
        {children}
      </div>
    </div>
  )
}
