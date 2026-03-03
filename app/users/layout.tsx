"use client"

import { useState } from "react"
import Sidebar from "@/components/sidebar/Sidebar"
import { userMenu } from "@/components/sidebar/menu.user"
import { Menu, X } from "lucide-react"
import { UnitProvider } from "@/context/UnitContext"

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <UnitProvider>
      <div className="min-h-screen bg-background overflow-x-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden md:fixed md:inset-y-0 md:w-64 md:border-r md:block">
          <Sidebar title="User Panel" menu={userMenu} />
        </aside>

        {/* Mobile sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-background border-r
            transform transition-transform duration-200 ease-in-out
            md:hidden
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          `}
        >
          <div className="p-4">
            <button
              onClick={() => setSidebarOpen(false)}
              className="mb-4 p-2 rounded hover:bg-muted"
              aria-label="Close Sidebar"
            >
              <X />
            </button>

            <Sidebar title="User Panel" menu={userMenu} />
          </div>
        </aside>

        {/* Main content */}
        <main className="md:ml-64 p-4 md:p-6">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden mb-4 p-2 rounded bg-muted hover:bg-muted/80"
            aria-label="Open Sidebar"
          >
            <Menu />
          </button>

          {children}
        </main>
      </div>
    </UnitProvider>
  )
}
