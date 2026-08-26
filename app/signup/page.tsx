"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
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
  Sun,
  UserRound,
} from "lucide-react"

import { auth, db } from "@/lib/firebase"
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

  useEffect(() => setMounted(true), [])

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
    <main className="relative min-h-screen bg-muted/30">
      <div className="page-grid pointer-events-none absolute inset-x-0 top-0 h-[560px] opacity-50" />

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="flex justify-center lg:justify-start">
          <div className="w-full max-w-lg">
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
                <div className="mb-2 flex items-center justify-between gap-3">
                  <Badge variant="secondary">Pendaftaran</Badge>
                  <span className="text-xs text-muted-foreground">Langkah {step} dari 2</span>
                </div>
                <CardTitle className="text-2xl">Buat akun Smart Biogas</CardTitle>
                <CardDescription>
                  {step === 1
                    ? "Isi informasi akun terlebih dahulu."
                    : "Tambahkan lokasi instalasi yang akan dipantau."}
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="mb-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <StepBadge active={step >= 1} number="1" label="Akun" />
                  <Separator className="w-10 sm:w-14" />
                  <StepBadge active={step >= 2} number="2" label="Lokasi" />
                </div>

                {error && (
                  <div className="mb-5 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                {step === 1 ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault()
                      next()
                    }}
                    className="space-y-5"
                  >
                    <Field label="Nama lengkap" htmlFor="signup-name">
                      <div className="relative">
                        <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="signup-name"
                          value={form.fullname}
                          autoComplete="name"
                          required
                          placeholder="Nama lengkap Anda"
                          className="pl-9"
                          onChange={(event) => update("fullname", event.target.value)}
                        />
                      </div>
                    </Field>

                    <Field label="Email" htmlFor="signup-email">
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="signup-email"
                          type="email"
                          value={form.email}
                          autoComplete="email"
                          required
                          placeholder="nama@email.com"
                          className="pl-9"
                          onChange={(event) => update("email", event.target.value)}
                        />
                      </div>
                    </Field>

                    <Field label="Password" htmlFor="signup-password">
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          autoComplete="new-password"
                          required
                          placeholder="Minimal 8 karakter"
                          className="pl-9 pr-10"
                          onChange={(event) => update("password", event.target.value)}
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
                      <p className="text-xs text-muted-foreground">Gunakan minimal 8 karakter.</p>
                    </Field>

                    <Button type="submit" className="w-full">
                      Lanjut ke lokasi
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                ) : (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault()
                      submit()
                    }}
                    className="space-y-5"
                  >
                    <Field label="Provinsi" htmlFor="signup-province">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="signup-province"
                          value={form.province}
                          required
                          placeholder="Contoh: Sulawesi Selatan"
                          className="pl-9"
                          onChange={(event) => update("province", event.target.value)}
                        />
                      </div>
                    </Field>

                    <Field label="Kota / Kabupaten" htmlFor="signup-city">
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="signup-city"
                          value={form.city}
                          required
                          placeholder="Kota atau kabupaten"
                          className="pl-9"
                          onChange={(event) => update("city", event.target.value)}
                        />
                      </div>
                    </Field>

                    <Field label="Alamat instalasi" htmlFor="signup-address">
                      <div className="relative">
                        <Home className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                        <textarea
                          id="signup-address"
                          value={form.address}
                          required
                          rows={4}
                          placeholder="Alamat lengkap lokasi instalasi biogas"
                          className="flex w-full resize-none rounded-md border border-input bg-background px-3 py-2 pl-9 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                          onChange={(event) => update("address", event.target.value)}
                        />
                      </div>
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setError("")
                          setStep(1)
                        }}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Kembali
                      </Button>

                      <Button type="submit" disabled={loading}>
                        {loading ? "Menyimpan..." : "Daftar"}
                        {!loading && <Check className="ml-2 h-4 w-4" />}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>

              <CardFooter className="justify-center border-t pt-6 text-sm text-muted-foreground">
                Sudah punya akun?{" "}
                <Link href="/login" className="ml-1 font-medium text-foreground hover:underline">
                  Masuk
                </Link>
              </CardFooter>
            </Card>
          </div>
        </section>

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
              <ShieldCheck className="h-3 w-3" />
              Akun & instalasi
            </Badge>
            <h2 className="mt-5 text-4xl font-bold tracking-tight">
              Satu akun untuk seluruh alur monitoring.
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Setelah email diverifikasi dan akun disetujui admin, perangkat dapat dihubungkan ke dashboard Smart Biogas.
            </p>
          </div>

          <div className="mt-10 space-y-3">
            <InfoRow icon={ShieldCheck} title="Verifikasi akun" description="Email diverifikasi sebelum akses dashboard." />
            <InfoRow icon={MapPin} title="Lokasi instalasi" description="Data lokasi disimpan pada profil pengguna." />
            <InfoRow icon={Activity} title="Hubungkan perangkat" description="Admin menetapkan device ID setelah akun direview." />
          </div>
        </section>
      </div>
    </main>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}

function StepBadge({ active, number, label }: { active: boolean; number: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold ${
          active ? "border-primary bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`}
      >
        {number}
      </span>
      <span className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
    </div>
  )
}

function InfoRow({
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
      <CardContent className="flex gap-3 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
          <Icon className="h-4 w-4 text-primary" />
        </span>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  )
}
