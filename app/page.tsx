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

const features: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: Radio,
    title: "Monitoring Realtime",
    description:
      "Pantau kondisi perangkat dan perubahan data sensor langsung dari dashboard tanpa perlu mengecek alat secara manual.",
  },
  {
    icon: BarChart3,
    title: "Histori & Analitik",
    description:
      "Data tersimpan sebagai histori sehingga perubahan flowrate, tekanan, suhu, dan energi lebih mudah dianalisis.",
  },
  {
    icon: MapPin,
    title: "Pemetaan Perangkat",
    description:
      "Lihat lokasi instalasi dan status perangkat dalam satu sistem untuk memudahkan pengelolaan lebih dari satu unit.",
  },
  {
    icon: Database,
    title: "Data Terpusat",
    description:
      "Firebase menghubungkan perangkat IoT dan dashboard sehingga data monitoring tersedia dalam satu sumber yang konsisten.",
  },
  {
    icon: ShieldCheck,
    title: "Akses Terstruktur",
    description:
      "Dashboard admin dan pengguna dipisahkan agar informasi dan pengelolaan perangkat tetap sesuai kebutuhan masing-masing.",
  },
  {
    icon: Zap,
    title: "Efisien untuk Operasional",
    description:
      "Ringkasan kondisi perangkat membantu pengguna melihat masalah dan tren penting dengan lebih cepat.",
  },
];

const telemetryCards = [
  { label: "Flowrate", value: "1.284", unit: "m³/h", icon: Wind },
  { label: "Tekanan", value: "3.42", unit: "kPa", icon: Gauge },
  { label: "Suhu", value: "31.6", unit: "°C", icon: Thermometer },
  { label: "Energi", value: "0.824", unit: "kWh", icon: Zap },
];

const chartBars = [32, 42, 38, 58, 51, 67, 62, 79, 70, 86, 74, 91];

export default function LandingPage() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -left-40 top-[-7rem] h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[-12rem] top-[16rem] h-[30rem] w-[30rem] rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-sky-400/5 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Leaf className="h-5 w-5" />
              <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-background bg-emerald-400" />
            </div>
            <div className="leading-tight">
              <p className="font-bold tracking-tight">Smart Biogas</p>
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                Intelligent Monitoring System
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
            <a href="#fitur" className="transition-colors hover:text-foreground">
              Fitur
            </a>
            <a href="#cara-kerja" className="transition-colors hover:text-foreground">
              Cara Kerja
            </a>
            <a href="#monitoring" className="transition-colors hover:text-foreground">
              Monitoring
            </a>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-card/70 text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground"
                  aria-label="Ubah tema"
                >
                  {!mounted ? (
                    <Sun className="h-4 w-4" />
                  ) : theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : theme === "system" ? (
                    <Laptop className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                </button>
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
            <Button asChild className="rounded-xl shadow-lg shadow-primary/15">
              <Link href="/signup">
                Daftar
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 pt-16 sm:px-6 md:pt-24 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:pb-28 lg:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            <Activity className="h-3.5 w-3.5" />
            Monitoring IoT untuk instalasi biogas
          </div>

          <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
            Data biogas yang lebih
            <span className="block bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 bg-clip-text text-transparent">
              mudah dipantau.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Smart Biogas menghubungkan perangkat sensor, Firebase, dan dashboard web
            untuk memantau flowrate, tekanan, suhu, energi, status perangkat, serta
            histori data dalam satu tampilan yang rapi.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" asChild className="h-12 rounded-xl px-6 shadow-xl shadow-primary/20">
              <Link href="/signup">
                Mulai Monitoring
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="h-12 rounded-xl px-6 bg-background/60">
              <Link href="/login">Buka Dashboard</Link>
            </Button>
          </div>

          <div className="mt-8 grid max-w-xl grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-3">
            {[
              "Realtime telemetry",
              "Histori sensor",
              "Multi-device",
            ].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                {item}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          id="monitoring"
          initial={{ opacity: 0, scale: 0.94, y: 18 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.08 }}
          className="relative"
        >
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-emerald-500/15 via-primary/5 to-teal-400/10 blur-2xl" />

          <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/85 shadow-2xl shadow-black/10 backdrop-blur-xl dark:shadow-black/30">
            <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Radio className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold">Device 001</p>
                  <p className="text-xs text-muted-foreground">Realtime overview</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                Online
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 sm:p-5">
              {telemetryCards.map(({ label, value, unit, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-border/60 bg-background/60 p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted-foreground">{label}</p>
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-2xl font-black tracking-tight sm:text-3xl">{value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{unit}</p>
                </div>
              ))}
            </div>

            <div className="mx-4 mb-4 rounded-2xl border border-border/60 bg-background/60 p-4 sm:mx-5 sm:mb-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold">Trend Energi</p>
                  <p className="text-xs text-muted-foreground">Data terbaru perangkat</p>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  +12.4%
                </span>
              </div>

              <div className="flex h-32 items-end gap-2">
                {chartBars.map((height, index) => (
                  <motion.div
                    key={`${height}-${index}`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: `${height}%`, opacity: 1 }}
                    transition={{ duration: 0.45, delay: 0.25 + index * 0.035 }}
                    className="flex-1 rounded-t-md bg-gradient-to-t from-emerald-500/40 to-emerald-500"
                  />
                ))}
              </div>
            </div>
          </div>

          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-6 -left-4 hidden rounded-2xl border border-border/70 bg-background/90 p-4 shadow-xl backdrop-blur-xl sm:block"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-500">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Firebase</p>
                <p className="text-sm font-bold">Data tersinkron</p>
              </div>
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
        <SectionHeading
          eyebrow="Fitur Utama"
          title="Satu dashboard untuk memahami kondisi instalasi"
          description="Informasi penting disusun agar mudah dibaca, tanpa membuat pengguna harus berburu angka di antara menu yang tidak perlu. Sebuah konsep revolusioner, rupanya."
        />

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: index * 0.04 }}
              className="group rounded-[1.5rem] border border-border/70 bg-card/70 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5"
            >
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold tracking-tight">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {feature.description}
              </p>
            </motion.article>
          ))}
        </div>
      </section>

      <section id="cara-kerja" className="border-y border-border/60 bg-muted/25 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            eyebrow="Cara Kerja"
            title="Dari sensor hingga dashboard dalam satu alur"
            description="Perangkat mengirim telemetry ke Firebase, lalu dashboard menampilkan data terbaru dan histori sesuai perangkat yang terhubung ke akun pengguna."
          />

          <div className="relative mt-14 grid gap-5 lg:grid-cols-3">
            <ProcessCard
              number="01"
              icon={<Radio className="h-5 w-5" />}
              title="Sensor membaca kondisi"
              description="ESP32 membaca parameter instalasi seperti flowrate, tekanan, suhu, dan energi dari perangkat sensor."
            />
            <ProcessCard
              number="02"
              icon={<Database className="h-5 w-5" />}
              title="Firebase menyimpan data"
              description="Data terbaru masuk ke node realtime, sementara data historis disimpan terpisah untuk grafik dan analisis."
            />
            <ProcessCard
              number="03"
              icon={<BarChart3 className="h-5 w-5" />}
              title="Dashboard menampilkan informasi"
              description="Admin dan pengguna melihat informasi perangkat melalui dashboard web yang responsif dan mudah dipahami."
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-gradient-to-br from-emerald-600 via-green-600 to-teal-700 px-6 py-12 text-white shadow-2xl shadow-emerald-900/15 sm:px-10 lg:px-14 lg:py-16">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-black/10 blur-3xl" />

          <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold">
                <Leaf className="h-3.5 w-3.5" />
                Smart Biogas Monitoring
              </div>
              <h2 className="max-w-3xl text-3xl font-black tracking-tight sm:text-4xl">
                Pantau perangkat biogas tanpa kehilangan gambaran besarnya.
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
                Buat akun, hubungkan perangkat yang telah disetujui, lalu akses telemetry dan histori melalui dashboard.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button size="lg" variant="secondary" asChild className="h-12 rounded-xl px-6 text-foreground">
                <Link href="/signup">
                  Buat Akun
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 rounded-xl border-white/30 bg-white/5 px-6 text-white hover:bg-white/15 hover:text-white"
              >
                <Link href="/login">Masuk Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 bg-background/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Leaf className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-bold">Smart Biogas</p>
              <p className="text-xs text-muted-foreground">Web-based monitoring system</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Smart Biogas. Sistem monitoring biogas berbasis IoT.
          </p>
        </div>
      </footer>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center md:text-left">
      <p className="text-xl font-black tracking-tight sm:text-2xl">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{label}</p>
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mx-auto max-w-3xl text-center">
      <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-400">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
        {description}
      </p>
    </div>
  );
}

function ProcessCard({
  number,
  icon,
  title,
  description,
}: {
  number: string;
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45 }}
      className="relative rounded-[1.5rem] border border-border/70 bg-background/80 p-6 shadow-sm"
    >
      <div className="mb-8 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          {icon}
        </div>
        <span className="font-mono text-sm font-black text-muted-foreground/50">{number}</span>
      </div>
      <h3 className="text-lg font-bold tracking-tight">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </motion.article>
  );
}
