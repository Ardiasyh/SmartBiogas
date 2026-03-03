"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function LandingPage() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="min-h-screen bg-background text-foreground">
      
      {/* NAVBAR */}
       <header className="w-full border-b bg-background/60 backdrop-blur">
        <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Smart Biogas</h1>

          <div className="flex items-center gap-4">
            <Link href="/signup">
              <Button variant="outline">Daftar</Button>
            </Link>
            <Link href="/login">
              <Button>Dashboard</Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors">
                  {theme === "light" ? <Sun /> : <Moon />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-background border shadow-md">
                <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </nav>
      </header>


      {/* HERO */}
      <section className="max-w-6xl mx-auto px-4 py-24 grid md:grid-cols-2 gap-10 items-center">

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl font-bold leading-tight mb-5">
            Pantau Biogas Dengan Cerdas dan Real-Time
          </h2>

          <p className="text-muted-foreground mb-8">
            Sistem monitoring modern untuk melihat tekanan, suhu, volume gas,
            dan stabilitas instalasi langsung dari dashboard yang simpel tapi kuat.
          </p>

          <div className="flex gap-4">
            <Link href="/signup">
              <Button size="lg">Mulai Sekarang</Button>
            </Link>

            <Link href="/login">
              <Button variant="ghost" size="lg">Lihat Dashboard</Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex justify-center"
        >
          <div className="w-full h-64 md:h-80 bg-gray-200 rounded-xl shadow-inner flex items-center justify-center">
            <span className="text-gray-500">
              ( Preview Dashboard )
            </span>
          </div>
        </motion.div>

      </section>


      {/* FITUR */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <h3 className="text-3xl font-bold text-center mb-12">
            Fitur Utama
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold mb-2">Monitoring Real-Time</h4>
                <p className="text-muted-foreground">
                  Lihat data sensor langsung tanpa delay, termasuk tekanan, suhu, dan level volume biogas.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold mb-2">Akses Multi-Role</h4>
                <p className="text-muted-foreground">
                  Admin, petugas, dan pengguna punya akses yang berbeda sesuai tugasnya. Anti salah klik.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold mb-2">Manajemen Device</h4>
                <p className="text-muted-foreground">
                  Hubungkan instalasi biogas dengan UID sensor dan atur dari satu tempat.
                </p>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>


      {/* TESTIMONI */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h3 className="text-3xl font-bold mb-12">
            Kata Mereka
          </h3>

          <div className="grid md:grid-cols-3 gap-8">
            
            <Card className="shadow-sm">
              <CardContent className="p-6">
                <p className="italic">“Sekarang gak perlu cek tangki manual tiap hari. Dashboard ini nyelametin waktu banyak banget.”</p>
                <p className="font-semibold mt-4">Petugas Lapangan</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <p className="italic">“Monitoringnya stabil dan akurat. Cocok buat instalasi skala besar.”</p>
                <p className="font-semibold mt-4">Pengelola Biogas</p>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-6">
                <p className="italic">“UI nya gampang dipake. Bahkan orang tua gue paham.”</p>
                <p className="font-semibold mt-4">Pengguna Rumah Tangga</p>
              </CardContent>
            </Card>

          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="py-24 bg-primary text-primary-foreground text-center">
        <h3 className="text-4xl font-bold mb-4">
          Siap Ngejalanin Monitoring Biogas Yang Serius?
        </h3>
        <p className="mb-8 opacity-90">
          Daftar sekarang dan nikmati kontrol penuh atas instalasi biogas Anda.
        </p>

        <Link href="/signup">
          <Button size="lg" variant="secondary">
            Daftar Gratis
          </Button>
        </Link>
      </section>


      {/* FOOTER */}
      <footer className="py-10 border-t text-center text-muted-foreground">
        <p>© {new Date().getFullYear()} BiogasSense. Semua hak dilindungi.</p>
      </footer>

    </div>
  );
}
