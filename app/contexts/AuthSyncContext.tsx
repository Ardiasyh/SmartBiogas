"use client"

import { createContext, useEffect } from "react"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"

export const AuthSyncContext = createContext(null)

export function AuthSyncProvider({
  children,
}: {
  children: React.ReactNode
}) {
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        await fetch("/api/auth/clear", { method: "POST" })
        return
      }

    })

    return () => unsub()
  }, [])

  return children
}
