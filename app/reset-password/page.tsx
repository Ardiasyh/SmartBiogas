"use client"

import { useState } from "react"
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { motion } from "framer-motion"
import { toast } from "sonner"

// UI
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)

  const handleReset = async () => {
    if (!email) {
      toast.error("Email wajib diisi")
      return
    }

    setLoading(true)
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success("Link reset password dikirim ke email kamu")
    } catch {
      toast.error("Email tidak terdaftar atau error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-xl">
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">
                Reset Password
              </h1>
              <p className="text-sm text-muted-foreground">
                Masukin email akun kamu.  
                Link reset bakal dikirim.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="admin@example.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button
              className="w-full"
              disabled={loading}
              onClick={handleReset}
            >
              {loading ? "Mengirim..." : "Kirim Link Reset"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Ingat password lagi?{" "}
              <a href="/login" className="underline">
                Login
              </a>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
