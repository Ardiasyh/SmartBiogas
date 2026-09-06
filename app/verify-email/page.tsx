"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { sendEmailVerification } from "firebase/auth"
import { toast } from "sonner"
import { ArrowRight, MailCheck, RefreshCcw, ShieldCheck } from "lucide-react"

import { auth } from "@/lib/firebase"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function VerifyEmailPage() {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [verified, setVerified] = useState(Boolean(auth.currentUser?.emailVerified))

  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        await auth.currentUser?.reload()
        if (auth.currentUser?.emailVerified) {
          setVerified(true)
        }
      } catch (error) {
        console.error("Gagal memeriksa verifikasi email:", error)
      }
    }, 4000)

    return () => window.clearInterval(interval)
  }, [])

  const resend = async () => {
    if (!auth.currentUser || sending) return

    setSending(true)
    try {
      await sendEmailVerification(auth.currentUser)
      toast.success("Email verifikasi berhasil dikirim ulang.")
    } catch (error) {
      console.error("Gagal mengirim verifikasi email:", error)
      toast.error("Email verifikasi belum dapat dikirim ulang.")
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-5 w-5" />
          </div>
          <div className="mb-2 flex justify-center">
            <Badge variant={verified ? "secondary" : "outline"} className="gap-1.5">
              <ShieldCheck className="h-3 w-3" />
              {verified ? "Email terverifikasi" : "Verifikasi disarankan"}
            </Badge>
          </div>
          <CardTitle>{verified ? "Email berhasil diverifikasi" : "Periksa email Anda"}</CardTitle>
          <CardDescription className="leading-6">
            {verified
              ? "Alamat email sudah terverifikasi. Anda dapat melanjutkan ke proses login."
              : "Kami telah mengirim tautan verifikasi. Verifikasi email tetap disarankan, tetapi Anda tidak perlu menunggu untuk login dan melihat status persetujuan admin."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3">
          {!verified && (
            <Button variant="outline" className="w-full" onClick={resend} disabled={sending}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              {sending ? "Mengirim..." : "Kirim ulang email verifikasi"}
            </Button>
          )}

          <Button className="w-full" onClick={() => router.push("/login")}>
            {verified ? "Lanjut ke login" : "Masuk sekarang"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {!verified && (
            <p className="text-center text-xs leading-5 text-muted-foreground">
              Akses dashboard tetap mengikuti status akun dari administrator. Akun Pending akan diarahkan ke halaman menunggu persetujuan.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
