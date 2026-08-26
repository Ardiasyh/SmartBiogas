"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Database,
  Gauge,
  Laptop,
  Leaf,
  MapPin,
  Moon,
  Radio,
  ShieldCheck,
  Sparkles,
  Sun,
  Thermometer,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const features: Array<{
  icon: LucideIcon;
  title: string;
  description: string;
  tone: string;
}> = [
  {
    icon: Radio,
    title: "Monitoring Realtime",
    description: "Pantau perubahan sensor dan status perangkat tanpa perlu mengecek alat secara manual.",
    tone: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300",
  },
  {
    icon: BarChart3,
    title: "Histori & Analitik",
    description: "Baca tren flowrate, tekanan, suhu, dan energi dari data histori yang tersimpan.",
    tone: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  },
  {
    icon: MapPin,
    title: "Pemetaan Perangkat",
    description: "Lihat lokasi instalasi dan status perangkat dalam satu sistem yang terpusat.",
    tone: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
  },
  {
    icon: Database,
    title: "Data Terpusat",
    description: "Firebase menghubungkan perangkat IoT dan dashboard sehingga data tetap konsisten.",
    tone: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  },
  {
    icon: ShieldCheck,
    title: "Akses Terstruktur",
    description: "Dashboard admin dan pengguna dipisahkan sesuai kebutuhan masing-masing role.",
    tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
  },
  {
    icon: Zap,
    title: "Ringkas & Efisien",
    description: "Ringkasan kondisi perangkat membantu pengguna memahami hal penting lebih cepat.",
    tone: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  },
];

const telemetryCards = [
  { label: "Flowrate", value: "1.284", unit: "m³/h", icon: Wind, tone: "cyan" },
  { label: "Tekanan", value: "3.42", unit: "kPa", icon: Gauge, tone: "amber" },
  { label: "Suhu", value: "31.6", unit: "°C", icon: Thermometer, tone: "rose" },
  { label: "Energi", value: "0.824", unit: "kWh", icon: Zap, tone: "violet" },
];

const chartBars = [32, 42, 38, 58, 51, 67, 62, 79, 70, 86, 74, 91];

const toneMap: Record<string, string> = {
  cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-300",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-300",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
};

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 top-[-8rem] h-[32rem] w-[32rem] rounded-full bg-indigo-500/12 blur-3xl" />
        <div className="absolute right-[-11rem] top-[10rem] h-[30rem] w-[30rem] rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute bottom-[18%] right-[8%] h-[18rem] w-[18rem] rounded-full bg-rose-400/7 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/72 backdrop-blur-2xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 via-primary to-violet-500 text-white shadow-lg shadow-primary/20">
              <Leaf className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-cyan-400" />
            </div>
            <div className="leading-tight">
              <p className="font-black tracking-tight">Smart Biogas</p>
              <p className="hidden text-[11px] text-muted-foreground sm:block">Intelligent Monitoring System</p>
            </div>
          </Link>

          <div className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#fitur" className="transition-colors hover:text-foreground">Fitur</a>
            <a href="#cara-kerja" className="transition-colors hover:text-foreground">Cara Kerja</a>
            <a href="#monitoring" className="transition-colors hover:text-foreground">Monitoring</a>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card/70 text-muted-foreground shadow-sm transition hover:-translate-y-0.5 hover:bg-muted hover:text-foreground"
                  aria-label="Ubah tema"
                >
                  {!mounted ? <Sun className="h-4 w-4" /> : theme === "dark" ? <Moon className="h-4 w-4" /> : theme === "system" ? <Laptop className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}><Sun className="mr-2 h-4 w-4" />Light</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}><Moon className="mr-2 h-4 w-4" />Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}><Laptop className="mr-2 h-4 w-4" />System</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" asChild className="hidden sm:inline-flex"><Link href="/login">Masuk</Link></Button>
            <Button asChild className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/20 hover:opacity-95">
              <Link href="/signup">Daftar <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-16 sm:px-6 md:pt-24 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:pb-28 lg:pt-28">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/8 px-3 py-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            Smart monitoring untuk instalasi biogas
          </div>

          <h1 className="max-w-3xl text-4xl font-black leading-[1.07] tracking-[-0.045em] sm:text-5xl lg:text-6xl">
            Monitoring biogas yang
            <span className="block bg-gradient-to-r from-indigo-500 via-sky-500 to-violet-500 bg-clip-text text-transparent">lebih jernih dan hidup.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Smart Biogas menghubungkan perangkat sensor, Firebase, dan dashboard web untuk memantau flowrate, tekanan, suhu, energi, status perangkat, dan histori dalam satu tampilan.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild className="h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 text-white shadow-xl shadow-indigo-500/20 hover:opacity-95">
              <Link href="/signup">Mulai Monitoring <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 rounded-xl bg-background/60 px-6"><Link href="/login">Buka Dashboard</Link></Button>
          </div>

          <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            {["Realtime telemetry", "Histori sensor", "Multi-device"].map((item, index) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${index === 0 ? "text-cyan-500" : index === 1 ? "text-violet-500" : "text-amber-500"}`} />
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          id="monitoring"
          initial={{ opacity: 0, scale: 0.95, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08 }}
          className="relative"
        >
          <div className="absolute -inset-7 -z-10 rounded-[2.8rem] bg-gradient-to-br from-indigo-500/18 via-cyan-400/8 to-violet-500/16 blur-2xl" />

          <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/82 shadow-2xl shadow-indigo-950/10 backdrop-blur-2xl dark:shadow-black/30">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"><Radio className="h-5 w-5" /></div>
                <div><p className="text-sm font-bold">Device 001</p><p className="text-xs text-muted-foreground">Realtime overview</p></div>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-cyan-500/15 bg-cyan-500/10 px-3 py-1.5 text-xs font-bold text-cyan-700 dark:text-cyan-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-cyan-500" />Online
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 sm:p-5">
              {telemetryCards.map(({ label, value, unit, icon: Icon, tone }) => (
                <div key={label} className="rounded-2xl border border-border/60 bg-background/58 p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${toneMap[tone]}`}><Icon className="h-4 w-4" /></div>
                  </div>
                  <p className="text-2xl font-black tracking-tight sm:text-3xl">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{unit}</p>
                </div>
              ))}
            </div>

            <div className="mx-4 mb-4 rounded-2xl border border-border/60 bg-background/58 p-4 sm:mx-5 sm:mb-5">
              <div className="mb-5 flex items-center justify-between">
                <div><p className="text-sm font-bold">Trend Energi</p><p className="text-xs text-muted-foreground">Data terbaru perangkat</p></div>
                <span className="rounded-full bg-violet-500/10 px-2.5 py-1 text-xs font-bold text-violet-600 dark:text-violet-300">Live</span>
              </div>
              <div className="flex h-32 items-end gap-2">
                {chartBars.map((height, index) => (
                  <motion.div
                    key={`${height}-${index}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: `${height}%`, opacity: 1 }}
                    transition={{ duration: 0.45, delay: 0.25 + index * 0.035 }}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-indigo-500/35 via-sky-500/70 to-violet-500"
                  />
                ))}
              </div>
            </div>
          </div>

          <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute -bottom-6 -left-4 hidden rounded-2xl border border-border/70 bg-background/90 p-4 shadow-xl backdrop-blur-xl sm:block">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500"><Database className="h-5 w-5" /></div>
              <div><p className="text-xs text-muted-foreground">Firebase</p><p className="text-sm font-bold">Data tersinkron</p></div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <section className="border-y border-border/60 bg-muted/25 py-8">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 sm:px-6 md:grid-cols-4 lg:px-8">
          <Stat value="4" label="Parameter utama" />
          <Stat value="24/7" label="Siap dimonitor" />
          <Stat value="RTDB" label="Realtime database" />
          <Stat value="Web" label="Akses dashboard" />
        </div>
      </section>

      <section id="fitur" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <SectionHeading eyebrow="Fitur Utama" title="Satu dashboard untuk memahami kondisi instalasi" description="Tampilan dirancang agar data sensor terasa ringan dibaca, tetapi tetap cukup kaya untuk kebutuhan monitoring dan analisis." />

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.35, delay: index * 0.04 }}
              whileHover={{ y: -5 }}
              className="group rounded-[1.75rem] border border-border/70 bg-card/70 p-6 shadow-[0_18px_55px_-42px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-shadow hover:shadow-[0_24px_65px_-38px_rgba(79,70,229,0.2)]"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${feature.tone}`}><feature.icon className="h-5 w-5" /></div>
              <h3 className="mt-5 text-lg font-bold tracking-tight">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.description}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="cara-kerja" className="border-y border-border/60 bg-muted/22 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading eyebrow="Cara Kerja" title="Dari sensor ke layar dalam tiga tahap" description="Alur data dibuat sederhana: alat membaca kondisi fisik, Firebase menyimpan dan mengirim data, dashboard menyajikannya untuk pengguna." />

          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            <ProcessCard number="01" icon={<Activity className="h-5 w-5" />} title="Perangkat membaca sensor" description="ESP32 mengambil data flowrate, tekanan, suhu, dan energi dari perangkat monitoring." tone="from-cyan-500/16 to-sky-500/4" />
            <ProcessCard number="02" icon={<Database className="h-5 w-5" />} title="Firebase menerima data" description="Data realtime dan histori disimpan terpisah agar monitoring dan analitik tetap rapi." tone="from-indigo-500/16 to-violet-500/4" />
            <ProcessCard number="03" icon={<BarChart3 className="h-5 w-5" />} title="Dashboard menampilkan insight" description="Pengguna melihat kondisi terbaru, grafik histori, status perangkat, dan lokasi instalasi." tone="from-violet-500/16 to-rose-500/4" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.4rem] border border-indigo-500/20 bg-gradient-to-br from-indigo-600 via-violet-600 to-sky-600 px-6 py-14 text-white shadow-2xl shadow-indigo-900/20 sm:px-10 lg:px-14">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-rose-300/15 blur-3xl" />
          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-100">Smart Biogas Platform</p>
              <h2 className="mt-3 max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">Monitoring yang terasa modern tanpa membuat data menjadi rumit.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-indigo-100 sm:text-base">Daftarkan akun, hubungkan perangkat, lalu pantau kondisi instalasi dari dashboard yang responsif.</p>
            </div>
            <Button size="lg" variant="secondary" asChild className="h-12 rounded-xl px-6 shadow-lg"><Link href="/signup">Daftar Sekarang <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-9">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-2 font-semibold text-foreground"><Leaf className="h-4 w-4 text-primary" />Smart Biogas</div>
          <p>© {new Date().getFullYear()} Smart Biogas Monitoring System.</p>
        </div>
      </footer>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div className="text-center"><p className="text-2xl font-black tracking-tight sm:text-3xl">{value}</p><p className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p></div>;
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-4 text-sm leading-7 text-muted-foreground sm:text-base">{description}</p>
    </div>
  );
}

function ProcessCard({ number, icon, title, description, tone }: { number: string; icon: ReactNode; title: string; description: string; tone: string }) {
  return (
    <article className={`relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-gradient-to-br ${tone} p-6`}>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-background/75 text-primary shadow-sm">{icon}</div>
        <span className="text-3xl font-black text-foreground/10">{number}</span>
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}
