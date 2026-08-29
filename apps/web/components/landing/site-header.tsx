"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Sparkles } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { ThemeToggle } from "@/components/theme-toggle"

const NAV_LINKS = [
  { href: "#try-now", label: "Try it" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#personalization", label: "Personalization" },
  { href: "#faq", label: "FAQ" },
] as const

const SCROLL_THRESHOLD = 24

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > SCROLL_THRESHOLD)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-border/60 bg-background/80 border-b shadow-sm backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center px-4 sm:px-6">
        <Link
          href="/"
          className={cn(
            "flex items-center gap-2 transition-all duration-300",
            scrolled
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0"
          )}
        >
          <span className="bg-primary/10 text-primary flex size-7 items-center justify-center rounded-md">
            <Sparkles className="size-4" />
          </span>
          <span className="text-sm font-semibold tracking-tight">Astra</span>
        </Link>

        <nav
          className={cn(
            "hidden flex-1 items-center justify-center gap-6 transition-all duration-300 md:flex",
            scrolled
              ? "translate-y-0 opacity-100"
              : "pointer-events-none -translate-y-1 opacity-0"
          )}
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign in</Link>
          </Button>
          <div
            className={cn(
              "transition-all duration-300",
              scrolled
                ? "translate-y-0 opacity-100"
                : "pointer-events-none w-0 overflow-hidden opacity-0"
            )}
          >
            <Button asChild size="sm">
              <Link href="/login">Try for free</Link>
            </Button>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
