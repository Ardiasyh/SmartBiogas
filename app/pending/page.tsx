"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { doc, onSnapshot } from "firebase/firestore"
import { onAuthStateChanged, sendEmailVerification, signOut } from "firebase/auth"
import { toast } from "sonner"
import {
  CheckCircle2,
  Clock3,
  LogOut,
  MailCheck,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react"

import { auth, db } from "@/lib/firebase"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function PendingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [email, setEmail] = useState("")
  const [emailVerified, setEmailVerified] = useState(false)

  useEffect(() => {
    let unsubscribeUser: (() => void) | undefined

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      unsubscribeUser?.()
      unsubscribeUser = undefined

      if (!user) {
        router.replace("/login")
        return
      }

      try {
        await user.reload()
      } catch (error) {
        console.error("Gagal memperbarui data autentikasi:", error)
      }

      setEmail(auth.currentUser?.email ?? user.email ?? "")
      setEmailVerified(Boolean(auth.currentUser?.emailVerified))

      unsubscribeUser = onSnapshot(doc(db, "users", user.uid), async (snapshot) => {
        if (!snapshot.exists()) {
          router.replace("/signup/complete-profile")
          return
        }

        const data = snapshot.data()
        if (typeof data.email === "string") setEmail(data.email)

        if (data.status?.toLowerCase() === "active") {
          try {
            await user.reload()
            setEmail(auth.currentUser?.email ?? user.email ?? "")
            setEmailVerified(Boolean(auth.currentUser?.emailVerified))

            const idToken = await user.getIdToken(true)
            const response = await fetch("/api/auth/sync", {
              method: "POST",
              headers: { Authorization: `Bearer ${idToken}` },
            })
            const body = await response.json()

            if (!response.ok) {
              toast.error(body.error ?? "Gagal membuat sesi")
              return
            }

            router.replace(
              body.access.role === "admin" ? "/admin/dashboard" : "/users/dashboard",
            )
            return
          } catch (error) {
            console.error("Gagal mengaktifkan sesi:", error)
            toast.error("Akun sudah aktif, tetapi sesi belum dapat diperbarui.")
          }
        }

        setLoading(false)
      })
    })

    return () => {
      unsubscribeUser?.()
      unsubscribeAuth()
    }
  }, [router])

  const resendVerification = async () => {
    const user = auth.currentUser
    if (!user || sending) return

    setSending(true)
    try {
      await user.reload()
      setEmail(user.email ?? email)

      if (user.emailVerified) {
        setEmailVerified(true)
        toast.success("Email sudah terverifikasi.")
        return
      }

      await sendEmailVerification(user)
      toast.success("Email verifikasi berhasil dikirim ulang.")
    } catch (error) {
      console.error("Gagal mengirim email verifikasi:", error)
      toast.error("Email verifikasi belum dapat dikirim ulang.")
    } finally {
      setSending(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <Card className="w-full max-w-lg shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Clock3 className="h-5 w-5" />
          </div>
          <div className="mb-2 flex justify-center">
            <Badge variant="secondary" className="gap-1.5">
              <ShieldCheck className="h-3 w-3" />
              Menunggu review admin
            </Badge>
          </div>
          <CardTitle className="text-2xl">Akun sedang menunggu persetujuan</CardTitle>
          <CardDescription className="mx-auto max-w-md leading-6">
            Data pendaftaran sudah diterima. Halaman ini akan memperbarui status secara otomatis setelah administrator menetapkan perangkat dan mengaktifkan akun.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Status akun</p>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                <Clock3 className="h-4 w-4 text-amber-500" />
                {loading ? "Memeriksa..." : "Pending"}
              </div>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4">
              <p className="text-xs text-muted-foreground">Verifikasi email</p>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                {emailVerified ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <MailCheck className="h-4 w-4 text-amber-500" />
                )}
                {emailVerified ? "Terverifikasi" : "Belum diverifikasi"}
              </div>
            </div>
          </div>

          {email && (
            <div className="rounded-lg border px-4 py-3">
              <p className="text-xs text-muted-foreground">Email login</p>
              <p className="mt-1 break-all text-sm font-medium">{email}</p>
            </div>
          )}

          {!emailVerified && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
              <p className="text-sm font-medium">Email belum terverifikasi</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Verifikasi email tidak menghalangi proses login atau persetujuan admin, tetapi tetap disarankan untuk memastikan alamat email benar-benar milik Anda.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={resendVerification}
                disabled={sending}
              >
                <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                {sending ? "Mengirim..." : "Kirim ulang verifikasi"}
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              await signOut(auth)
              await fetch("/api/auth/clear", { method: "POST" }).catch(() => undefined)
              router.replace("/login")
            }}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Keluar dari akun
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
