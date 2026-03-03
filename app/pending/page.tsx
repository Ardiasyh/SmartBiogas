"use client"

import { useEffect, useState } from "react"
import { auth, db } from "@/lib/firebase"
import { doc, onSnapshot } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { signOut, onAuthStateChanged } from "firebase/auth"
import { motion } from "framer-motion"
import { toast } from "sonner"

// UI
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// ICON
import { Clock, LogOut, CheckCircle } from "lucide-react"

export default function PendingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login")
        return
      }

      const unsubUser = onSnapshot(
        doc(db, "users", user.uid),
        async (snap) => {
          if (!snap.exists()) {
            router.replace("/signup/complete-profile")
            return
          }

          const data = snap.data()

          // 🔥 STATUS SUDAH ACTIVE
          if (data.status === "Active") {
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

          router.replace(
            data.role === "admin"
              ? "/admin/dashboard"
              : "/users/dashboard"
          )
        }

          // ⏳ MASIH PENDING
          setLoading(false)
        }
      )

      return () => unsubUser()
    })

    return () => unsubAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl">
          <CardContent className="p-8 text-center space-y-6">

            <Clock className="w-14 h-14 mx-auto text-primary animate-pulse" />

            <h1 className="text-2xl font-bold">
              Menunggu Persetujuan Admin
            </h1>

            <p className="text-sm text-muted-foreground">
              Data kamu sudah masuk.  
              Admin lagi ngecek. Santai aja, sistem ini auto-update.
            </p>

            {!loading && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4" />
                Status: Pending
              </div>
            )}

            <Button
              variant="outline"
              className="w-full flex gap-2"
              onClick={async () => {
                await signOut(auth)
                router.replace("/login")
              }}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>

          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
