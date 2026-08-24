"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"

import Sidebar from "@/components/sidebar/Sidebar"
import { adminMenu } from "@/components/sidebar/menu.admin"
import { UnitProvider } from "@/context/UnitContext"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <UnitProvider>
      <div className="relative min-h-screen overflow-x-hidden bg-background">
        <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
          <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-cyan-400/5 blur-3xl" />
        </div>

        <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:block md:w-72">
          <Sidebar title="Admin Panel" menu={adminMenu} />
        </aside>

        {sidebarOpen && (
          <button
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-sm md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar overlay"
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-72 transform transition-transform duration-300 ease-out md:hidden ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar title="Admin Panel" menu={adminMenu} />
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background/80 text-muted-foreground shadow-sm backdrop-blur hover:text-foreground"
            aria-label="Close Sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </aside>

        <main className="relative z-10 min-h-screen md:ml-72">
          <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-card/80 shadow-sm backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-md md:hidden"
              aria-label="Open Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>

            {children}
          </div>
        </main>
      </div>
    </UnitProvider>
  )
}
