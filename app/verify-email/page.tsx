"use client"

import { useEffect } from "react"
import { auth } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MailCheck } from "lucide-react"

export default function VerifyEmailPage() {
  const router = useRouter()

  useEffect(() => {
    const interval = setInterval(async () => {
      await auth.currentUser?.reload()
      if (auth.currentUser?.emailVerified) {
        router.push("/login")
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader>
          <MailCheck className="mx-auto h-10 w-10 text-primary" />
          <CardTitle>Cek Email Kamu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Kami sudah mengirim email verifikasi.  
            Setelah diverifikasi, kamu akan otomatis diarahkan ke login.
          </p>
          <Button variant="outline" onClick={() => auth.currentUser?.sendEmailVerification()}>
            Kirim ulang email
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
