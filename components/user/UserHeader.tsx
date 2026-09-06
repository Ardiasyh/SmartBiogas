"use client"

import { useEffect, useMemo, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { doc, onSnapshot } from "firebase/firestore"
import { Activity, Sparkles } from "lucide-react"

import { auth, db } from "@/lib/firebase"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Props = {
  status?: string
}

export default function UserHeader({ status }: Props) {
  const [username, setUsername] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let stopProfile: (() => void) | null = null

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      stopProfile?.()
      stopProfile = null

      if (!user) {
        setUsername("")
        setLoading(false)
        return
      }

      setLoading(true)
      stopProfile = onSnapshot(
        doc(db, "users", user.uid),
        (snapshot) => {
          setUsername(snapshot.exists() ? snapshot.data().fullname || "User" : "User")
          setLoading(false)
        },
        (error) => {
          console.error("Gagal mengambil data user:", error)
          setUsername("User")
          setLoading(false)
        },
      )
    })

    return () => {
      unsubscribeAuth()
      stopProfile?.()
    }
  }, [])

  const online = useMemo(() => status?.toLowerCase() === "online", [status])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-5 w-28 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-8 w-64 max-w-full animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-muted" />
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Badge variant="secondary" className="mb-3">
              <Sparkles className="h-3 w-3" />
              Smart Biogas Monitoring
            </Badge>
            <CardTitle className="text-2xl sm:text-3xl">Halo, {username}</CardTitle>
            <CardDescription className="mt-2 max-w-2xl text-sm leading-6">
              Pantau kondisi digester, aliran gas, tekanan, suhu, energi, dan histori perangkat dari satu dashboard.
            </CardDescription>
          </div>

          <Badge
            variant="outline"
            className={
              online
                ? "border-sky-500/30 bg-sky-500/5 px-3 py-1.5 text-sky-700 dark:text-sky-400"
                : "border-rose-500/30 bg-rose-500/5 px-3 py-1.5 text-rose-700 dark:text-rose-400"
            }
          >
            <span className={`h-2 w-2 rounded-full ${online ? "bg-sky-500" : "bg-rose-500"}`} />
            <Activity className="h-3 w-3" />
            {online ? "Device online" : "Device offline"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="border-t bg-muted/20 py-3 text-xs text-muted-foreground">
        Data realtime dibaca dari perangkat yang terhubung ke akun ini.
      </CardContent>
    </Card>
  )
}
