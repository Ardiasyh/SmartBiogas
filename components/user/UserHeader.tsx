"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"

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

  if (loading) {
    return (
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Memuat...</h1>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">
        Halo, {username}
      </h1>
      <p className="text-gray-500">
        Monitoring penggunaan biogas kamu.
      </p>
      <p className="text-gray-500">
        Status akun: {status}
      </p>
    </div>
  )
}
