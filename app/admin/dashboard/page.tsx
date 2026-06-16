"use client";

import { useState } from "react";

import UserTable from "@/components/admin/user-table";
import UserDashboardOverview from "@/components/admin/UserDashboardOverview";
import DeviceMap from "@/components/admin/DeviceMap";
//import TotalEnergyChart from "@/components/admin/TotalEnergyChart";

export default function AdminDashboardPage() {
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  // const [search, setSearch] = useState("");

  return (
    <div className="p-6 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan aktivitas dan data pengguna.
        </p>
      </div>

      {/* OVERVIEW + CHART */}
      <section className="rounded-xl border p-4 bg-card">
        <div className="bg-white dark:bg-neutral-900 rounded-xl p-4 shadow-sm">
          <UserDashboardOverview />
        </div>

      </section>

      {/* MAP */}
      <section className="rounded-xl border p-4 bg-card">
        <DeviceMap
          selectedProvince={selectedProvince}
          onSelectProvince={setSelectedProvince}
        />
      </section>

      {/* TABLE */}
      <section className="rounded-xl border p-4 bg-card">
        <UserTable
          filterProvince={selectedProvince}
        />
      </section>
    </div>
  );
}
