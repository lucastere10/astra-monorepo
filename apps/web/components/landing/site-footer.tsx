import Link from "next/link"
import { Sparkles } from "lucide-react"

export function SiteFooter() {
  return (
    <footer className="border-border/60 border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary flex size-6 items-center justify-center rounded-md">
            <Sparkles className="size-3.5" />
          </span>
          <span className="text-foreground font-medium">Astra</span>
        </div>
        <p>Daily &amp; weekly technology intelligence.</p>
        <div className="flex items-center gap-4">
          <Link href="/login" className="hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </Link>
        </div>
      </div>
    </footer>
  )
}
