"use client";

import { useState } from "react";
import { MapPinned, ShieldCheck, UsersRound } from "lucide-react";

import UserTable from "@/components/admin/user-table";
import UserDashboardOverview from "@/components/admin/UserDashboardOverview";
import DeviceMap from "@/components/admin/DeviceMap";

export default function AdminDashboardPage() {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  return (
    <div className="space-y-8 pb-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card/75 p-6 shadow-[0_22px_70px_-42px_rgba(22,163,74,0.35)] backdrop-blur-xl sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs font-bold text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              Administration center
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Admin Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Pantau performa sistem, konektivitas perangkat, lokasi instalasi, dan aktivitas pengguna dari satu panel.
            </p>
          </div>

          <div className="flex w-fit items-center gap-3 rounded-2xl border border-border/70 bg-background/55 px-4 py-3 shadow-sm backdrop-blur">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Firebase</p>
              <p className="text-sm font-bold">Realtime monitoring aktif</p>
            </div>
          </div>
        </div>
      </section>

      <UserDashboardOverview />

      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 shadow-[0_20px_60px_-42px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 border-b border-border/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <MapPinned className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Device map</p>
              <h2 className="text-xl font-bold tracking-tight">Peta instalasi perangkat</h2>
            </div>
          </div>

          {selectedProvince && (
            <div className="w-fit rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs font-semibold text-primary">
              Filter: {selectedProvince}
            </div>
          )}
        </div>

        <div className="p-3 sm:p-5">
          <DeviceMap
            selectedProvince={selectedProvince}
            onSelectProvince={setSelectedProvince}
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 shadow-[0_20px_60px_-42px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex flex-col gap-3 border-b border-border/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
              <UsersRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">User management</p>
              <h2 className="text-xl font-bold tracking-tight">Daftar pengguna</h2>
            </div>
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            Review akun, device ID, lokasi, dan status konektivitas.
          </p>
        </div>

        <div className="p-3 sm:p-5">
          <UserTable filterProvince={selectedProvince} />
        </div>
      </section>
    </div>
  );
}
