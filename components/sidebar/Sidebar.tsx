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
  PanelLeftClose,
  PanelLeftOpen,
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
  collapsed = false,
  onToggleCollapse,
}: {
  title: string
  menu: MenuItem[]
  collapsed?: boolean
  onToggleCollapse?: () => void
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
    <aside className="relative flex h-full w-full flex-col border-r bg-sidebar text-sidebar-foreground">
      {onToggleCollapse ? (
        <button
          type="button"
          onClick={onToggleCollapse}
          className="absolute -right-3.5 top-6 z-20 hidden h-7 w-7 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground md:flex"
          aria-label={collapsed ? "Buka sidebar" : "Tutup sidebar"}
          title={collapsed ? "Buka sidebar" : "Tutup sidebar"}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5" />
          )}
        </button>
      ) : null}

      <div className={cn("py-5", collapsed ? "px-3" : "px-4")}>
        <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Leaf className="h-4 w-4" />
          </span>

          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Smart Biogas</p>
              <p className="truncate text-xs text-muted-foreground">{title}</p>
            </div>
          ) : null}
        </div>
      </div>

      <Separator />

      <div className={cn("py-4", collapsed ? "px-3" : "px-4")}>
        {collapsed ? (
          <div
            className="flex h-9 items-center justify-center rounded-md border bg-background/50"
            title="Realtime system active"
            aria-label="Realtime system active"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-sky-500" />
            </span>
          </div>
        ) : (
          <Badge variant="outline" className="w-full justify-start gap-2 py-1.5 font-normal">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
            </span>
            Realtime system active
          </Badge>
        )}
      </div>

      <nav className={cn("flex-1 overflow-y-auto pb-4", collapsed ? "px-2" : "px-3")}>
        {!collapsed ? (
          <p className="px-2 pb-2 text-xs font-medium text-muted-foreground">Navigation</p>
        ) : null}

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
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={cn(
                  "group flex items-center rounded-md py-2 text-sm font-medium transition-colors",
                  collapsed ? "justify-center px-2" : "gap-3 px-3",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-primary")} />

                {!collapsed ? (
                  <>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-60",
                        active && "opacity-60",
                      )}
                    />
                  </>
                ) : null}
              </Link>
            )
          })}
        </div>
      </nav>

      <Separator />

      <div className={cn("space-y-3", collapsed ? "p-2" : "p-3")}>
        <div className={cn("rounded-lg border bg-background/60", collapsed ? "p-1.5" : "p-2")}>
          {!collapsed ? (
            <p className="px-1 pb-2 text-xs font-medium text-muted-foreground">Appearance</p>
          ) : null}

          {mounted ? (
            <div className="grid grid-cols-3 gap-1">
              <ThemeButton
                active={theme === "light"}
                icon={Sun}
                label="Light"
                compact={collapsed}
                onClick={() => setTheme("light")}
              />
              <ThemeButton
                active={theme === "dark"}
                icon={Moon}
                label="Dark"
                compact={collapsed}
                onClick={() => setTheme("dark")}
              />
              <ThemeButton
                active={theme === "system"}
                icon={Laptop}
                label="Auto"
                compact={collapsed}
                onClick={() => setTheme("system")}
              />
            </div>
          ) : (
            <div className="h-8" />
          )}
        </div>

        <Button
          type="button"
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          className={cn(
            "text-destructive hover:bg-destructive/10 hover:text-destructive",
            collapsed ? "mx-auto flex" : "w-full justify-start",
          )}
          onClick={logout}
          title={collapsed ? "Logout" : undefined}
          aria-label={collapsed ? "Logout" : undefined}
        >
          <LogOut className={cn("h-4 w-4", !collapsed && "mr-2")} />
          {!collapsed ? "Logout" : null}
        </Button>
      </div>
    </aside>
  )
}

function ThemeButton({
  active,
  icon: Icon,
  label,
  compact = false,
  onClick,
}: {
  active: boolean
  icon: LucideIcon
  label: string
  compact?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center rounded-md text-xs transition-colors",
        compact ? "h-7 w-full px-0" : "gap-1.5 px-2 py-2",
        active
          ? "bg-secondary text-secondary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
      title={`${label} mode`}
      aria-label={`${label} mode`}
    >
      <Icon className="h-3.5 w-3.5" />
      {!compact ? <span className="hidden xl:inline">{label}</span> : null}
    </button>
  )
}
