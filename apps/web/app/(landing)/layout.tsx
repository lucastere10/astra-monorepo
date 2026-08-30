import { SiteFooter } from "@/components/landing/site-footer"
import { SiteHeader } from "@/components/landing/site-header"

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="relative flex min-h-svh flex-col">
      <div
        aria-hidden
        className="landing-grain pointer-events-none fixed inset-0 z-[60] opacity-[0.035] mix-blend-multiply dark:opacity-[0.06] dark:mix-blend-overlay"
      />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
