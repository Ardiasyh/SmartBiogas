"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth"
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Eye,
  EyeOff,
  Leaf,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
} from "lucide-react"

import { auth } from "@/lib/firebase"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M21.35 11.1h-9.2v2.8h5.3c-.2 1.3-1.3 3.8-5.3 3.8-3.2 0-5.8-2.7-5.8-6s2.6-6 5.8-6c1.8 0 3 .8 3.7 1.5l2.3-2.2C17 3.1 15 2 12.5 2 7.6 2 3.6 5.9 3.6 11s4 9 8.9 9c5.1 0 8.5-3.6 8.5-8.7 0-.6-.1-1-.1-1.2z"
    />
  </svg>
)

export default function LoginForm({
  className,
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  const afterLogin = async () => {
    const idToken = await auth.currentUser?.getIdToken()
    if (!idToken) throw new Error("Sesi Firebase tidak ditemukan")

    const response = await fetch("/api/auth/sync", {
      method: "POST",
      headers: { Authorization: `Bearer ${idToken}` },
    })

    const body = await response.json()
    if (!response.ok) throw new Error(body.error ?? "Gagal membuat sesi")

    await auth.currentUser?.getIdToken(true)

    const access = body.access
    if (!access.profileCompleted) return router.push("/signup/complete-profile")
    if (access.status !== "active") return router.push("/pending")

    toast.success("Login berhasil")
    router.push(access.role === "admin" ? "/admin/dashboard" : "/users/dashboard")
  }

  const handleLogin = async () => {
    setLoading(true)

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)

      if (!cred.user.emailVerified) {
        toast.error("Email belum diverifikasi")
        return
      }

      await afterLogin()
    } catch {
      toast.error("Email atau password salah")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)

    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      await afterLogin()
    } catch {
      toast.error("Login Google gagal")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("relative min-h-screen bg-muted/30", className)}>
      <div className="page-grid pointer-events-none absolute inset-x-0 top-0 h-[520px] opacity-50" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <section className="hidden lg:block">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </span>
            <div>
              <p className="font-semibold">Smart Biogas</p>
              <p className="text-xs text-muted-foreground">IoT Monitoring Platform</p>
            </div>
          </Link>

          <div className="mt-14 max-w-md">
            <Badge variant="secondary">
              <Activity className="h-3 w-3" />
              Monitoring realtime
            </Badge>
            <h1 className="mt-5 text-4xl font-bold tracking-tight">
              Kembali ke dashboard monitoring Anda.
            </h1>
            <p className="mt-4 leading-7 text-muted-foreground">
              Masuk untuk melihat flowrate, tekanan, suhu, energi, histori perangkat, dan lokasi instalasi dari satu tempat.
            </p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            <InfoCard icon={BarChart3} title="Analytics" description="History sensor" />
            <InfoCard icon={Activity} title="Realtime" description="Live telemetry" />
            <InfoCard icon={ShieldCheck} title="Access" description="Role based" />
          </div>
        </section>

        <section className="flex justify-center lg:justify-end">
          <div className="w-full max-w-md">
            <div className="mb-5 flex items-center justify-between">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali
                </Link>
              </Button>

              {mounted && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  aria-label="Ganti tema"
                >
                  {resolvedTheme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            <Card className="shadow-lg">
              <CardHeader>
                <div className="mb-2 flex items-center gap-2 lg:hidden">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                    <Leaf className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold">Smart Biogas</span>
                </div>
                <CardTitle className="text-2xl">Masuk ke akun</CardTitle>
                <CardDescription>
                  Gunakan akun yang sudah terdaftar untuk membuka dashboard monitoring.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    handleLogin()
                  }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        value={email}
                        autoComplete="email"
                        required
                        placeholder="nama@email.com"
                        className="pl-9"
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="login-password">Password</Label>
                      <button
                        type="button"
                        onClick={() => router.push("/reset-password")}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Lupa password?
                      </button>
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        autoComplete="current-password"
                        required
                        placeholder="Masukkan password"
                        className="pl-9 pr-10"
                        onChange={(event) => setPassword(event.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full">
                    {loading ? "Memproses..." : "Masuk ke dashboard"}
                  </Button>

                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">atau</span>
                    <Separator className="flex-1" />
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full"
                  >
                    <GoogleIcon />
                    Lanjut dengan Google
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="justify-center border-t pt-6 text-sm text-muted-foreground">
                Belum punya akun?{" "}
                <Link href="/signup" className="ml-1 font-medium text-foreground hover:underline">
                  Daftar
                </Link>
              </CardFooter>
            </Card>
          </div>
        </section>
      </div>
    </div>
  )
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Activity
  title: string
  description: string
}) {
  return (
    <Card className="shadow-none">
      <CardContent className="p-4">
        <Icon className="h-4 w-4 text-primary" />
        <p className="mt-3 text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
