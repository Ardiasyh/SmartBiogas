"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import {
  Leaf,
  LogOut,
  Sun,
  Moon,
  Laptop,
  ChevronRight,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

type MenuItem = {
  label: string
  href: string
  icon: LucideIcon
}

export default function Sidebar({
  title,
  menu,
}: {
  title: string
  menu: MenuItem[]
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  const logout = () => {
    document.cookie = "token=; Max-Age=0; path=/"
    router.push("/login")
  }

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden border-r border-border/70 bg-sidebar/90 text-sidebar-foreground backdrop-blur-2xl">
      <div className="border-b border-border/60 px-5 pb-5 pt-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Leaf className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-sidebar bg-emerald-400" />
          </div>

          <div className="min-w-0">
            <p className="truncate text-base font-bold tracking-tight">Smart Biogas</p>
            <p className="truncate text-xs font-medium text-muted-foreground">{title}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-primary/10 bg-primary/5 px-3 py-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Monitoring
            </p>
            <p className="truncate text-xs font-semibold text-foreground">Realtime system active</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-5">
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">
          Navigation
        </p>

        {menu.map((item, index) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(`${item.href}/`))
          const Icon = item.icon

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: index * 0.04 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/15"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl transition-all duration-200",
                    active
                      ? "bg-white/15 text-primary-foreground"
                      : "bg-muted/70 text-muted-foreground group-hover:bg-background group-hover:text-primary",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <span className="min-w-0 flex-1 truncate">{item.label}</span>

                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-all duration-200",
                    active
                      ? "translate-x-0 opacity-90"
                      : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-70",
                  )}
                />
              </Link>
            </motion.div>
          )
        })}
      </nav>

      <div className="border-t border-border/60 p-3">
        <div className="rounded-2xl border border-border/70 bg-background/60 p-2 shadow-sm">
          <div className="mb-2 flex items-center justify-between px-2 pt-1">
            <span className="text-xs font-medium text-muted-foreground">Appearance</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">Theme</span>
          </div>

          {mounted && (
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/60 p-1">
              <ThemeButton
                active={theme === "light"}
                label="Light"
                onClick={() => setTheme("light")}
                icon={Sun}
              />
              <ThemeButton
                active={theme === "dark"}
                label="Dark"
                onClick={() => setTheme("dark")}
                icon={Moon}
              />
              <ThemeButton
                active={theme === "system"}
                label="Auto"
                onClick={() => setTheme("system")}
                icon={Laptop}
              />
            </div>
          )}

          <button
            onClick={logout}
            className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  )
}

function ThemeButton({
  active,
  label,
  onClick,
  icon: Icon,
}: {
  active: boolean
  label: string
  onClick: () => void
  icon: LucideIcon
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[11px] font-medium transition-all",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
      aria-label={`${label} mode`}
      title={`${label} mode`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden xl:inline">{label}</span>
    </button>
  )
}
