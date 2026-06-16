"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"
import {
  LogOut,
  Sun,
  Moon,
  Laptop,
} from "lucide-react"
import { useState, useEffect } from "react"

type MenuItem = {
  label: string
  href: string
  icon: any
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
    <aside
      className="
        h-full w-64
        bg-background text-foreground
        border-r border-border
        flex flex-col
      "
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-border font-semibold">
        {title}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {menu.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        {/* Theme toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Theme
          </span>

          {/* Render theme buttons hanya setelah mounted */}
          {mounted && (
            <div className="flex gap-1">
              <button
                onClick={() => setTheme("light")}
                className={cn(
                  "p-2 rounded hover:bg-muted",
                  theme === "light" && "bg-muted"
                )}
                aria-label="Light mode"
              >
                <Sun size={16} />
              </button>

              <button
                onClick={() => setTheme("dark")}
                className={cn(
                  "p-2 rounded hover:bg-muted",
                  theme === "dark" && "bg-muted"
                )}
                aria-label="Dark mode"
              >
                <Moon size={16} />
              </button>

              <button
                onClick={() => setTheme("system")}
                className={cn(
                  "p-2 rounded hover:bg-muted",
                  theme === "system" && "bg-muted"
                )}
                aria-label="System mode"
              >
                <Laptop size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={logout}
          className="
            flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm
            text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30
          "
        >
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </aside>
  )
}
