"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Activity, Search } from "lucide-react";

import { db } from "@/lib/firebase";
import HistoryReplay from "@/components/admin/HistoryReplay";
import ExportExcelButton from "@/components/export/ExportExcelButton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type DeviceOption = {
  deviceId: string;
  fullname: string;
  email: string;
};

export default function AdminHistoryPanel() {
  const [devices, setDevices] = useState<DeviceOption[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getDocs(collection(db, "users"))
      .then((snapshot) => {
        if (cancelled) return;

        const uniqueDevices = new Map<string, DeviceOption>();
        snapshot.docs.forEach((document) => {
          const value = document.data();
          const deviceId = typeof value.deviceId === "string" ? value.deviceId.trim() : "";
          if (!deviceId || uniqueDevices.has(deviceId)) return;

          uniqueDevices.set(deviceId, {
            deviceId,
            fullname: typeof value.fullname === "string" ? value.fullname : "Pengguna",
            email: typeof value.email === "string" ? value.email : "",
          });
        });

        setDevices([...uniqueDevices.values()].sort((a, b) => a.fullname.localeCompare(b.fullname, "id")));
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Daftar perangkat gagal dimuat.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredDevices = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("id");
    if (!query) return devices;
    return devices.filter((device) =>
      `${device.deviceId} ${device.fullname} ${device.email}`.toLocaleLowerCase("id").includes(query),
    );
  }, [devices, search]);

  const selectedDevice = devices.find((device) => device.deviceId === selectedDeviceId);

  return (
    <div className="space-y-6 pb-8">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <Badge variant="secondary" className="mb-3 gap-1.5">
                <Activity className="h-3 w-3" /> Histori perangkat
              </Badge>
              <CardTitle className="text-2xl sm:text-3xl">History Data</CardTitle>
              <CardDescription className="mt-2 max-w-2xl leading-6">
                Pilih perangkat untuk melihat histori satu jam terakhir atau memuat file Excel dan memutar ulang tren datanya.
              </CardDescription>
            </div>
            <Badge variant="outline" className="w-fit">{devices.length} perangkat terdaftar</Badge>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pilih perangkat</CardTitle>
          <CardDescription>Cari berdasarkan nama pengguna, email, atau device ID.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari perangkat atau pengguna…"
              className="pl-9"
              aria-label="Cari perangkat atau pengguna"
            />
          </div>

          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              Gagal memuat daftar perangkat: {error}
            </div>
          ) : loading ? (
            <div className="h-16 animate-pulse rounded-md bg-muted/40" />
          ) : filteredDevices.length === 0 ? (
            <p className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
              {devices.length === 0 ? "Belum ada perangkat yang terhubung ke pengguna." : "Perangkat tidak ditemukan."}
            </p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {filteredDevices.map((device) => {
                const selected = device.deviceId === selectedDeviceId;
                return (
                  <button
                    key={device.deviceId}
                    type="button"
                    onClick={() => setSelectedDeviceId(device.deviceId)}
                    aria-pressed={selected}
                    className={`min-w-0 rounded-lg border p-3 text-left transition-colors hover:bg-muted/40 ${selected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-background"}`}
                  >
                    <span className="block truncate text-sm font-medium">{device.fullname}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">{device.email || "Email tidak tersedia"}</span>
                    <span className="mt-2 block truncate font-mono text-xs text-primary">{device.deviceId}</span>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedDeviceId && (
        <div className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {selectedDevice && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">Menampilkan histori untuk</span>
                <span className="font-medium">{selectedDevice.fullname}</span>
                <Badge variant="outline" className="font-mono">{selectedDevice.deviceId}</Badge>
              </div>
            )}
            <ExportExcelButton deviceId={selectedDeviceId} variant="outline" size="sm" />
          </div>
          <HistoryReplay key={selectedDeviceId} deviceId={selectedDeviceId} />
        </div>
      )}
    </div>
  );
}
