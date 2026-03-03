"use client"

import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, Settings, LogOut, MapPin } from "lucide-react"

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const menu = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", href: "/admin/user", icon: Users },
    { name: "Device Map", href: "/admin/device-map", icon: MapPin },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ]

  const handleLogout = () => {
    // Bisa tambah clear auth session di sini kalau pakai Firebase / JWT
    router.push("/") // langsung redirect ke landing page
  }

  return (
    <aside className="h-screen w-64 bg-card border-r flex flex-col p-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Smart Biogas Admin</h1>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {menu.map((item) => {
          const Icon = item.icon
          const active = pathname.startsWith(item.href)

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted"
              )}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
      >
        <LogOut size={20} />
        Logout
      </button>
    </aside>
  )
}
