"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import {
  ChevronRight,
  Laptop,
  Leaf,
  LogOut,
  Moon,
  Sun,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

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

  useEffect(() => setMounted(true), [])

  const logout = () => {
    document.cookie = "token=; Max-Age=0; path=/"
    router.push("/login")
  }

  return (
    <aside className="flex h-full w-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="px-4 py-5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Leaf className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Smart Biogas</p>
            <p className="truncate text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
      </div>

      <Separator />

      <div className="px-4 py-4">
        <Badge variant="outline" className="w-full justify-start gap-2 py-1.5 font-normal">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
          </span>
          Realtime system active
        </Badge>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        <p className="px-2 pb-2 text-xs font-medium text-muted-foreground">Navigation</p>

        <div className="space-y-1">
          {menu.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(`${item.href}/`))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4", active && "text-primary")} />
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60",
                    active && "opacity-60",
                  )}
                />
              </Link>
            )
          })}
        </div>
      </nav>

      <Separator />

      <div className="space-y-3 p-3">
        <div className="rounded-lg border bg-background/60 p-2">
          <p className="px-1 pb-2 text-xs font-medium text-muted-foreground">Appearance</p>

          {mounted && (
            <div className="grid grid-cols-3 gap-1">
              <ThemeButton
                active={theme === "light"}
                icon={Sun}
                label="Light"
                onClick={() => setTheme("light")}
              />
              <ThemeButton
                active={theme === "dark"}
                icon={Moon}
                label="Dark"
                onClick={() => setTheme("dark")}
              />
              <ThemeButton
                active={theme === "system"}
                icon={Laptop}
                label="Auto"
                onClick={() => setTheme("system")}
              />
            </div>
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={logout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  )
}

function ThemeButton({
  active,
  icon: Icon,
  label,
  onClick,
}: {
  active: boolean
  icon: LucideIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs transition-colors",
        active
          ? "bg-secondary text-secondary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
      title={`${label} mode`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span className="hidden xl:inline">{label}</span>
    </button>
  )
}
