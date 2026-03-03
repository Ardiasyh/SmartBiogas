"use client"

import { createContext, useEffect } from "react"
import { auth, db } from "@/lib/firebase"
import { onAuthStateChanged } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"

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

      const snap = await getDoc(doc(db, "users", user.uid))
      if (!snap.exists()) return

      const data = snap.data()

      await fetch("/api/auth/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          role: data.role,
          status: data.status,
          profileCompleted: data.profileCompleted,
        }),
      })
    })

    return () => unsub()
  }, [])

  return children
}
