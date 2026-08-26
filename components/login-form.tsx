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
  Sparkles,
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
    <div className={cn("relative min-h-screen overflow-hidden bg-background text-foreground", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_center_right,rgba(168,85,247,0.10),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.045)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.08fr_0.92fr]">
        <motion.section
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="relative hidden overflow-hidden border-r border-border/60 px-10 py-10 lg:flex lg:flex-col lg:justify-between"
        >
          <div>
            <Link href="/" className="inline-flex items-center gap-3">
              <span className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-primary to-violet-500 text-white shadow-lg shadow-indigo-500/20">
                <Leaf className="h-5 w-5" />
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-cyan-400" />
              </span>
              <div>
                <p className="font-black tracking-tight">Smart Biogas</p>
                <p className="text-xs text-muted-foreground">IoT Monitoring Platform</p>
              </div>
            </Link>

            <div className="mt-20 max-w-xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/8 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                <Sparkles className="h-3.5 w-3.5" />
                Monitoring terhubung secara real-time
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight xl:text-5xl">
                Kembali ke pusat kendali
                <span className="block bg-gradient-to-r from-indigo-500 via-sky-500 to-violet-500 bg-clip-text text-transparent">
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
              { icon: Gauge, label: "Sensor", value: "Realtime", tone: "text-cyan-500" },
              { icon: BarChart3, label: "Riwayat", value: "Terekam", tone: "text-violet-500" },
              { icon: ShieldCheck, label: "Akses", value: "Terkontrol", tone: "text-amber-500" },
            ].map(({ icon: Icon, label, value, tone }) => (
              <div key={label} className="rounded-2xl border border-border/70 bg-card/68 p-4 shadow-sm backdrop-blur-xl">
                <Icon className={`mb-4 h-5 w-5 ${tone}`} />
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
              <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
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
                  {resolvedTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              )}
            </div>

            <div className="mb-8 lg:hidden">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white">
                  <Leaf className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-black">Smart Biogas</p>
                  <p className="text-xs text-muted-foreground">IoT Monitoring Platform</p>
                </div>
              </div>
            </div>

            <div className="relative overflow-hidden rounded-[28px] border border-border/70 bg-card/78 p-6 shadow-2xl shadow-indigo-950/8 backdrop-blur-2xl sm:p-8 dark:shadow-black/20">
              <div className="pointer-events-none absolute -right-16 -top-20 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />
              <div className="relative">
                <div className="mb-7">
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-primary">Welcome back</p>
                  <h2 className="text-3xl font-black tracking-tight">Masuk ke akun</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Gunakan akun yang sudah terdaftar untuk membuka dashboard monitoring.</p>
                </div>

                <form
                  onSubmit={(event) => {
                    event.preventDefault()
                    handleLogin()
                  }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label htmlFor="login-email" className="text-sm font-semibold">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-500" />
                      <Input
                        id="login-email"
                        type="email"
                        value={email}
                        autoComplete="email"
                        required
                        placeholder="nama@email.com"
                        className="h-12 rounded-xl border-border/70 bg-background/70 pl-10 focus-visible:border-indigo-500/50"
                        onChange={(event) => setEmail(event.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label htmlFor="login-password" className="text-sm font-semibold">Password</label>
                      <button type="button" onClick={() => router.push("/reset-password")} className="text-xs font-semibold text-primary transition-opacity hover:opacity-75">Lupa password?</button>
                    </div>

                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        autoComplete="current-password"
                        required
                        placeholder="Masukkan password"
                        className="h-12 rounded-xl border-border/70 bg-background/70 pl-10 pr-11 focus-visible:border-violet-500/50"
                        onChange={(event) => setPassword(event.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-transform hover:-translate-y-0.5 hover:opacity-95">
                    {loading ? "Memproses..." : "Masuk ke Dashboard"}
                  </Button>

                  <div className="relative py-1">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/70" /></div>
                    <div className="relative flex justify-center"><span className="bg-card px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">atau lanjut dengan</span></div>
                  </div>

                  <Button type="button" variant="outline" onClick={handleGoogleLogin} disabled={loading} className="h-12 w-full rounded-xl border-border/70 bg-background/60 font-semibold">
                    <GoogleIcon />Google
                  </Button>
                </form>

                <p className="mt-7 text-center text-sm text-muted-foreground">
                  Belum punya akun?{" "}
                  <Link href="/signup" className="font-bold text-primary hover:underline">Buat akun baru</Link>
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Wifi className="h-3.5 w-3.5 text-cyan-500" />
              Smart Biogas Monitoring Platform
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
