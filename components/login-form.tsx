"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { motion } from "framer-motion"
import { toast } from "sonner"
import {
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth"
import {
  ArrowLeft,
  BarChart3,
  Eye,
  EyeOff,
  Gauge,
  Leaf,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
  Wifi,
} from "lucide-react"

import { auth } from "@/lib/firebase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

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

  useEffect(() => {
    setMounted(true)
  }, [])

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
    <div
      className={cn(
        "relative min-h-screen overflow-hidden bg-background text-foreground",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,197,94,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.10),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.08fr_0.92fr]">
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="relative hidden overflow-hidden border-r border-border/60 px-10 py-10 lg:flex lg:flex-col lg:justify-between"
        >
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Leaf className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-400" />
              </span>
              <div>
                <p className="font-bold tracking-tight">Smart Biogas</p>
                <p className="text-xs text-muted-foreground">IoT Monitoring Platform</p>
              </div>
            </Link>

            <div className="mt-20 max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <Wifi className="h-3.5 w-3.5" />
                Monitoring terhubung secara real-time
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight xl:text-5xl">
                Kembali ke pusat kendali
                <span className="block bg-gradient-to-r from-emerald-500 to-green-700 bg-clip-text text-transparent">
                  Smart Biogas Anda.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
                Pantau flowrate, tekanan, suhu, energi, dan status perangkat dari satu dashboard yang tersinkron dengan Firebase.
              </p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {[
              { icon: Gauge, label: "Sensor", value: "Realtime" },
              { icon: BarChart3, label: "Riwayat", value: "Terekam" },
              { icon: ShieldCheck, label: "Akses", value: "Terkontrol" },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm backdrop-blur-xl"
              >
                <Icon className="mb-4 h-5 w-5 text-primary" />
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="w-full max-w-md"
          >
            <div className="mb-8 flex items-center justify-between">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Kembali
              </Link>

              {mounted && (
                <button
                  type="button"
                  onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card/80 text-muted-foreground shadow-sm backdrop-blur transition-all hover:-translate-y-0.5 hover:text-foreground"
                  aria-label="Ganti tema"
                >
                  {resolvedTheme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>

            <div className="mb-8 lg:hidden">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                  <Leaf className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold">Smart Biogas</p>
                  <p className="text-xs text-muted-foreground">IoT Monitoring Platform</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-border/70 bg-card/80 p-6 shadow-2xl shadow-black/5 backdrop-blur-2xl sm:p-8 dark:shadow-black/20">
              <div className="mb-7">
                <p className="mb-2 text-xs font-bold uppercase tracking-[0.22em] text-primary">
                  Welcome back
                </p>
                <h2 className="text-3xl font-black tracking-tight">Masuk ke akun</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Gunakan akun yang sudah terdaftar untuk membuka dashboard monitoring.
                </p>
              </div>

              <form
                onSubmit={(event) => {
                  event.preventDefault()
                  handleLogin()
                }}
                className="space-y-5"
              >
                <div className="space-y-2">
                  <label htmlFor="login-email" className="text-sm font-semibold">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      autoComplete="email"
                      required
                      placeholder="nama@email.com"
                      className="h-12 rounded-xl border-border/70 bg-background/70 pl-10"
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label htmlFor="login-password" className="text-sm font-semibold">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => router.push("/reset-password")}
                      className="text-xs font-semibold text-primary transition-opacity hover:opacity-75"
                    >
                      Lupa password?
                    </button>
                  </div>

                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      autoComplete="current-password"
                      required
                      placeholder="Masukkan password"
                      className="h-12 rounded-xl border-border/70 bg-background/70 pl-10 pr-11"
                      onChange={(event) => setPassword(event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/20 transition-transform hover:-translate-y-0.5"
                >
                  {loading ? "Memproses..." : "Masuk ke Dashboard"}
                </Button>

                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border/70" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-card px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                      atau lanjut dengan
                    </span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="h-12 w-full rounded-xl border-border/70 bg-background/60 font-semibold"
                >
                  <GoogleIcon />
                  Google
                </Button>
              </form>

              <p className="mt-7 text-center text-sm text-muted-foreground">
                Belum punya akun?{" "}
                <Link href="/signup" className="font-bold text-primary hover:underline">
                  Buat akun baru
                </Link>
              </p>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Smart Biogas • Monitoring perangkat yang lebih rapi, karena kabel saja sudah cukup berantakan.
            </p>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
