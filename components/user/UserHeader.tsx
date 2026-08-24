"use client"

import { useEffect, useMemo, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { motion } from "framer-motion"
import { Activity, Sparkles } from "lucide-react"

import { auth, db } from "@/lib/firebase"

type Props = {
  status?: string
}

export default function UserHeader({ status }: Props) {
  const [username, setUsername] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setUsername("")
        setLoading(false)
        return
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid))

        if (snap.exists()) {
          const data = snap.data()
          setUsername(data.fullname || "User")
        } else {
          setUsername("User")
        }
      } catch (error) {
        console.error("Gagal mengambil data user:", error)
        setUsername("User")
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  const online = useMemo(
    () => status?.toLowerCase() === "online",
    [status],
  )

  if (loading) {
    return (
      <div className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/70 p-6 shadow-sm backdrop-blur-xl sm:p-8">
        <div className="h-4 w-24 animate-pulse rounded-full bg-muted" />
        <div className="mt-4 h-10 w-64 max-w-full animate-pulse rounded-2xl bg-muted" />
        <div className="mt-3 h-4 w-80 max-w-full animate-pulse rounded-full bg-muted" />
      </div>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card/75 p-6 shadow-[0_24px_80px_-36px_rgba(22,163,74,0.35)] backdrop-blur-xl sm:p-8"
    >
      <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary/12 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-1/3 h-32 w-32 rounded-full bg-cyan-400/8 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Smart Biogas Monitoring
          </div>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Halo, {username}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Pantau kondisi digester, aliran gas, tekanan, suhu, dan energi secara realtime dari satu dashboard.
          </p>
        </div>

        <div
          className={`inline-flex w-fit items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm ${
            online
              ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300"
          }`}
        >
          <span className="relative flex h-3 w-3">
            {online && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            )}
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${
                online ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
          </span>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">
              Device status
            </p>
            <p className="flex items-center gap-1.5 text-sm font-bold">
              <Activity className="h-4 w-4" />
              {online ? "Online" : "Offline"}
            </p>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
