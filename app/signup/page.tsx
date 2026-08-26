"use client"

import { useEffect, useState, type ReactNode } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { AnimatePresence, motion } from "framer-motion"
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Eye,
  EyeOff,
  Home,
  Leaf,
  Lock,
  Mail,
  MapPin,
  Moon,
  ShieldCheck,
  Sparkles,
  Sun,
  UserRound,
  type LucideIcon,
} from "lucide-react"

import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function SignupPage() {
  const router = useRouter()
  const { resolvedTheme, setTheme } = useTheme()

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [form, setForm] = useState({
    fullname: "",
    email: "",
    password: "",
    province: "",
    city: "",
    address: "",
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const update = (key: keyof typeof form, value: string) => {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  const next = () => {
    if (!form.fullname || !form.email || !form.password) {
      setError("Lengkapi data akun terlebih dahulu.")
      return
    }

    if (form.password.length < 8) {
      setError("Password minimal 8 karakter.")
      return
    }

    setError("")
    setStep(2)
  }

  const submit = async () => {
    if (!form.province || !form.city || !form.address) {
      setError("Alamat instalasi belum lengkap.")
      return
    }

    try {
      setLoading(true)
      setError("")

      const cred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password,
      )

      await sendEmailVerification(cred.user)

      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        fullname: form.fullname,
        email: form.email,
        role: "user",
        province: form.province,
        city: form.city,
        address: form.address,
        status: "pending",
        profileCompleted: true,
        createdAt: serverTimestamp(),
      })

      router.push("/verify-email")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mendaftar.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.18),transparent_32%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.12),transparent_30%),radial-gradient(circle_at_center_left,rgba(168,85,247,0.10),transparent_26%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.045)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full max-w-lg"
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

            <div className="mb-7 lg:hidden">
              <div className="flex items-center gap-3">
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
              <div className="pointer-events-none absolute -right-20 -top-24 h-44 w-44 rounded-full bg-cyan-500/8 blur-3xl" />
              <div className="relative">
                <div className="mb-7">
                  <p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-primary">Mulai monitoring</p>
                  <h1 className="text-3xl font-black tracking-tight">Buat akun baru</h1>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">Daftarkan akun dan lokasi instalasi. Setelah disetujui admin, perangkat dapat dihubungkan ke dashboard.</p>
                </div>

                <div className="mb-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <StepIndicator active={step >= 1} current={step === 1} number={1} label="Akun" tone="indigo" />
                  <div className="h-px w-10 bg-gradient-to-r from-indigo-500/40 to-violet-500/40 sm:w-14" />
                  <StepIndicator active={step >= 2} current={step === 2} number={2} label="Lokasi" tone="violet" />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 rounded-2xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  >
                    {error}
                  </motion.div>
                )}

                <AnimatePresence mode="wait" initial={false}>
                  {step === 1 ? (
                    <motion.form
                      key="account"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.24 }}
                      onSubmit={(event) => {
                        event.preventDefault()
                        next()
                      }}
                      className="space-y-5"
                    >
                      <AuthField id="signup-name" label="Nama lengkap" icon={UserRound} tone="text-cyan-500">
                        <Input
                          id="signup-name"
                          value={form.fullname}
                          autoComplete="name"
                          required
                          placeholder="Nama lengkap Anda"
                          className="h-12 rounded-xl border-border/70 bg-background/70 pl-10 focus-visible:border-cyan-500/50"
                          onChange={(event) => update("fullname", event.target.value)}
                        />
                      </AuthField>

                      <AuthField id="signup-email" label="Email" icon={Mail} tone="text-indigo-500">
                        <Input
                          id="signup-email"
                          type="email"
                          value={form.email}
                          autoComplete="email"
                          required
                          placeholder="nama@email.com"
                          className="h-12 rounded-xl border-border/70 bg-background/70 pl-10 focus-visible:border-indigo-500/50"
                          onChange={(event) => update("email", event.target.value)}
                        />
                      </AuthField>

                      <AuthField id="signup-password" label="Password" icon={Lock} tone="text-violet-500">
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            value={form.password}
                            autoComplete="new-password"
                            required
                            placeholder="Minimal 8 karakter"
                            className="h-12 rounded-xl border-border/70 bg-background/70 pl-10 pr-11 focus-visible:border-violet-500/50"
                            onChange={(event) => update("password", event.target.value)}
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
                      </AuthField>

                      <Button type="submit" className="h-12 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 font-bold text-white shadow-lg shadow-indigo-500/20 transition-transform hover:-translate-y-0.5 hover:opacity-95">
                        Lanjut ke lokasi
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="location"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -24 }}
                      transition={{ duration: 0.24 }}
                      onSubmit={(event) => {
                        event.preventDefault()
                        submit()
                      }}
                      className="space-y-5"
                    >
                      <AuthField id="signup-province" label="Provinsi" icon={MapPin} tone="text-rose-500">
                        <Input
                          id="signup-province"
                          value={form.province}
                          required
                          placeholder="Contoh: Sulawesi Selatan"
                          className="h-12 rounded-xl border-border/70 bg-background/70 pl-10 focus-visible:border-rose-500/50"
                          onChange={(event) => update("province", event.target.value)}
                        />
                      </AuthField>

                      <AuthField id="signup-city" label="Kota / Kabupaten" icon={Building2} tone="text-amber-500">
                        <Input
                          id="signup-city"
                          value={form.city}
                          required
                          placeholder="Kota atau kabupaten"
                          className="h-12 rounded-xl border-border/70 bg-background/70 pl-10 focus-visible:border-amber-500/50"
                          onChange={(event) => update("city", event.target.value)}
                        />
                      </AuthField>

                      <AuthField id="signup-address" label="Alamat instalasi" icon={Home} tone="text-sky-500">
                        <textarea
                          id="signup-address"
                          value={form.address}
                          required
                          rows={3}
                          placeholder="Alamat lengkap lokasi instalasi biogas"
                          className="flex w-full resize-none rounded-xl border border-input bg-background/70 px-3 py-3 pl-10 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-sky-500/50 focus-visible:ring-[3px] focus-visible:ring-sky-500/10"
                          onChange={(event) => update("address", event.target.value)}
                        />
                      </AuthField>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12 rounded-xl"
                          onClick={() => {
                            setError("")
                            setStep(1)
                          }}
                        >
                          <ArrowLeft className="h-4 w-4" />
                          Kembali
                        </Button>

                        <Button type="submit" disabled={loading} className="h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 font-bold text-white shadow-lg shadow-indigo-500/20 hover:opacity-95">
                          {loading ? "Menyimpan..." : "Daftar"}
                          {!loading && <Check className="h-4 w-4" />}
                        </Button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                <p className="mt-7 text-center text-sm text-muted-foreground">
                  Sudah punya akun?{" "}
                  <Link href="/login" className="font-bold text-primary hover:underline">Masuk di sini</Link>
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-muted-foreground">Setelah pendaftaran, verifikasi email diperlukan sebelum akun dapat digunakan.</p>
          </motion.div>
        </section>

        <motion.section
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55 }}
          className="relative hidden overflow-hidden border-l border-border/60 px-10 py-10 lg:flex lg:flex-col lg:justify-between"
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
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/8 px-3 py-1.5 text-xs font-bold text-violet-700 dark:text-violet-300">
                <Sparkles className="h-3.5 w-3.5" />
                Satu akun untuk satu ekosistem monitoring
              </div>

              <h2 className="text-4xl font-black leading-tight tracking-tight xl:text-5xl">
                Dari instalasi ke data,
                <span className="block bg-gradient-to-r from-indigo-500 via-sky-500 to-violet-500 bg-clip-text text-transparent">
                  semuanya lebih terukur.
                </span>
              </h2>

              <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">Daftarkan lokasi instalasi biogas Anda, hubungkan perangkat, lalu pantau kondisi sensor dan histori produksi melalui dashboard Smart Biogas.</p>
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            {[
              { icon: ShieldCheck, label: "Akun", value: "Terverifikasi", tone: "text-indigo-500" },
              { icon: MapPin, label: "Instalasi", value: "Terpetakan", tone: "text-rose-500" },
              { icon: Activity, label: "Monitoring", value: "Realtime", tone: "text-cyan-500" },
            ].map(({ icon: Icon, label, value, tone }) => (
              <div key={label} className="rounded-2xl border border-border/70 bg-card/68 p-4 shadow-sm backdrop-blur-xl">
                <Icon className={`mb-4 h-5 w-5 ${tone}`} />
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="mt-1 font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  )
}

function AuthField({
  id,
  label,
  icon: Icon,
  tone,
  children,
}: {
  id: string
  label: string
  icon: LucideIcon
  tone: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-semibold">{label}</label>
      <div className="relative">
        <Icon className={`pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 ${tone}`} />
        {children}
      </div>
    </div>
  )
}

function StepIndicator({
  active,
  current,
  number,
  label,
  tone,
}: {
  active: boolean
  current: boolean
  number: number
  label: string
  tone: "indigo" | "violet"
}) {
  const activeClass = tone === "indigo" ? "from-indigo-500 to-sky-500" : "from-violet-500 to-fuchsia-500"

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-all ${active ? `bg-gradient-to-br ${activeClass} text-white shadow-md` : "bg-muted text-muted-foreground"} ${current ? "ring-4 ring-primary/10" : ""}`}>
        {active && number < 2 && !current ? <Check className="h-4 w-4" /> : number}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Step {number}</p>
        <p className="truncate text-sm font-bold">{label}</p>
      </div>
    </div>
  )
}
