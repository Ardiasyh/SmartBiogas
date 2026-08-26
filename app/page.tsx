"use client";

import { useEffect, useState } from "react"
import Link from "next/link"
import { useTheme } from "next-themes"
import {
  Activity,
  ArrowRight,
  BarChart3,
  Database,
  Gauge,
  Laptop,
  Leaf,
  MapPin,
  Moon,
  Radio,
  ShieldCheck,
  Sun,
  Thermometer,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

const telemetry = [
  { label: "Flowrate", value: "1.284", unit: "m³/h", icon: Wind, className: "text-sky-600 dark:text-sky-400" },
  { label: "Tekanan", value: "3.42", unit: "kPa", icon: Gauge, className: "text-amber-600 dark:text-amber-400" },
  { label: "Suhu", value: "31.6", unit: "°C", icon: Thermometer, className: "text-rose-600 dark:text-rose-400" },
  { label: "Energi", value: "0.824", unit: "kWh", icon: Zap, className: "text-violet-600 dark:text-violet-400" },
]

const features: Array<{
  icon: LucideIcon
  title: string
  description: string
}> = [
  {
    icon: Radio,
    title: "Monitoring realtime",
    description: "Pantau data perangkat terkini langsung dari Firebase Realtime Database.",
  },
  {
    icon: BarChart3,
    title: "Histori & analitik",
    description: "Lihat perubahan flowrate, tekanan, suhu, dan energi dari data history.",
  },
  {
    icon: MapPin,
    title: "Pemetaan perangkat",
    description: "Kelola lokasi instalasi dan lihat perangkat dari satu dashboard.",
  },
  {
    icon: Database,
    title: "Data terpusat",
    description: "Sensor, Firebase, dan dashboard bekerja dalam alur data yang konsisten.",
  },
  {
    icon: ShieldCheck,
    title: "Akses terstruktur",
    description: "Admin dan pengguna mendapatkan tampilan sesuai kebutuhan masing-masing.",
  },
  {
    icon: Activity,
    title: "Status perangkat",
    description: "Ketahui apakah perangkat sedang online atau tidak melalui timestamp terbaru.",
  },
]

export default function LandingPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="page-grid pointer-events-none fixed inset-x-0 top-0 -z-10 h-[620px] opacity-60" />

      <header className="sticky top-0 z-50 border-b bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Smart Biogas</p>
              <p className="hidden text-xs text-muted-foreground sm:block">Monitoring System</p>
            </div>
          </Link>

          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#fitur" className="transition-colors hover:text-foreground">Fitur</a>
            <a href="#alur" className="transition-colors hover:text-foreground">Cara kerja</a>
            <a href="#preview" className="transition-colors hover:text-foreground">Preview</a>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Ubah tema">
                  {!mounted ? (
                    <Sun className="h-4 w-4" />
                  ) : theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : theme === "system" ? (
                    <Laptop className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Laptop className="mr-2 h-4 w-4" /> System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/login">Masuk</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">
                Daftar
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_1fr] lg:items-center lg:px-8 lg:py-28">
        <div>
          <Badge variant="secondary" className="mb-5">
            <Activity className="h-3 w-3" />
            IoT monitoring platform
          </Badge>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Pantau instalasi biogas dengan data yang lebih jelas.
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Smart Biogas menghubungkan perangkat sensor, Firebase, dan dashboard web untuk memantau flowrate, tekanan, suhu, energi, status perangkat, dan histori data.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup">
                Mulai monitoring
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Buka dashboard</Link>
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            <Badge variant="outline">Realtime telemetry</Badge>
            <Badge variant="outline">Firebase RTDB</Badge>
            <Badge variant="outline">Multi-device</Badge>
            <Badge variant="outline">Dark mode</Badge>
          </div>
        </div>

        <Card id="preview" className="overflow-hidden shadow-xl">
          <CardHeader className="border-b">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-base">Device 001</CardTitle>
                <CardDescription>Realtime device overview</CardDescription>
              </div>
              <Badge variant="outline" className="border-sky-500/30 text-sky-600 dark:text-sky-400">
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-sky-500" />
                Online
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-5 p-5">
            <div className="grid grid-cols-2 gap-3">
              {telemetry.map(({ label, value, unit, icon: Icon, className }) => (
                <Card key={label} className="shadow-none">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">{label}</p>
                      <Icon className={`h-4 w-4 ${className}`} />
                    </div>
                    <p className="mt-4 text-2xl font-semibold tracking-tight">{value}</p>
                    <p className="text-xs text-muted-foreground">{unit}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="shadow-none">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-sm">Trend energi</CardTitle>
                    <CardDescription>12 pembacaan terakhir</CardDescription>
                  </div>
                  <Badge variant="secondary">Live</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex h-28 items-end gap-2">
                  {[30, 42, 36, 58, 51, 68, 60, 76, 69, 84, 75, 90].map((height, index) => (
                    <div
                      key={index}
                      className="flex-1 rounded-sm bg-primary/80"
                      style={{ height: `${height}%`, opacity: 0.35 + index * 0.045 }}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </section>

      <Separator />

      <section id="fitur" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <Badge variant="outline">Fitur utama</Badge>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Komponen penting tanpa tampilan yang berisik.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Gaya shadcn membuat informasi tetap fokus pada data. Sebuah terobosan setelah umat manusia terlalu lama menaruh gradient di setiap permukaan.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="shadow-sm">
              <CardHeader>
                <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-md border bg-muted">
                  <Icon className="h-4 w-4" />
                </span>
                <CardTitle className="text-base">{title}</CardTitle>
                <CardDescription className="leading-6">{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section id="alur" className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <Badge variant="secondary">Cara kerja</Badge>
              <h2 className="mt-4 text-3xl font-bold tracking-tight">Dari sensor sampai dashboard.</h2>
              <p className="mt-3 text-muted-foreground">
                Alur data dibuat sederhana agar perangkat dan aplikasi web punya tanggung jawab yang jelas.
              </p>
            </div>

            <Card>
              <CardContent className="grid gap-0 p-0 md:grid-cols-3">
                <FlowStep number="01" title="Perangkat" description="ESP32 membaca sensor dan menyiapkan telemetry." />
                <FlowStep number="02" title="Firebase" description="Realtime menyimpan kondisi terbaru, logs menyimpan histori." bordered />
                <FlowStep number="03" title="Dashboard" description="Web menampilkan status, grafik, lokasi, dan data user." />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <Card className="border-primary/20 bg-primary/[0.03]">
          <CardContent className="p-8 sm:p-12">
            <Badge>Smart Biogas</Badge>
            <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">Mulai monitoring dari satu dashboard.</h2>
            <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
              Daftarkan akun, hubungkan perangkat, dan pantau instalasi dengan UI yang bersih dan konsisten.
            </p>
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Button size="lg" asChild>
                <Link href="/signup">Buat akun <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">Masuk</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            <span className="font-medium text-foreground">Smart Biogas</span>
          </div>
          <p>© {new Date().getFullYear()} Smart Biogas Monitoring System</p>
        </div>
      </footer>
    </main>
  )
}

function FlowStep({
  number,
  title,
  description,
  bordered = false,
}: {
  number: string
  title: string
  description: string
  bordered?: boolean
}) {
  return (
    <div className={`p-6 ${bordered ? "border-y md:border-x md:border-y-0" : ""}`}>
      <p className="font-mono text-xs text-muted-foreground">{number}</p>
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}
