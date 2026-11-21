"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { DivIcon } from "leaflet";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { ArrowLeft, Gauge, MapPin, Thermometer, Wind, Zap } from "lucide-react";

import { db } from "@/lib/firebase";
import { watchDeviceTelemetry } from "@/lib/device-telemetry";
import { DEVICE_OFFLINE_TIMEOUT_MS } from "@/lib/telemetry";
import { loadDeviceStatusMarkerIcon, type DeviceMarkerStatus } from "@/lib/leaflet-marker";
import LiveTelemetryCharts from "@/components/charts/user/LiveTelemetryCharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import "leaflet/dist/leaflet.css";

const MapContainer = dynamic(
  () => import("react-leaflet").then((module) => module.MapContainer),
  { ssr: false },
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((module) => module.TileLayer),
  { ssr: false },
);
const Marker = dynamic(
  () => import("react-leaflet").then((module) => module.Marker),
  { ssr: false },
);
const Popup = dynamic(
  () => import("react-leaflet").then((module) => module.Popup),
  { ssr: false },
);

type FlowUnit = "m3h" | "lmin";
type PowerUnit = "kw" | "w";
type TempUnit = "c" | "f";
type PressureUnit = "kpa" | "bar";

const convertFlow = (value: number, unit: FlowUnit) =>
  unit === "lmin" ? (value * 1000) / 60 : value;
const convertPower = (value: number, unit: PowerUnit) =>
  unit === "w" ? value * 1000 : value;
const convertTemp = (value: number, unit: TempUnit) =>
  unit === "f" ? value * 1.8 + 32 : value;
const convertPressure = (value: number, unit: PressureUnit) =>
  unit === "bar" ? value / 100 : value;

const flowUnitLabel = (unit: FlowUnit) => (unit === "lmin" ? "L/min" : "m³/h");
const powerUnitLabel = (unit: PowerUnit) => (unit === "w" ? "W" : "kW");
const pressureUnitLabel = (unit: PressureUnit) => (unit === "bar" ? "bar" : "kPa");

type UserData = {
  fullname: string;
  email: string;
  locationName: string;
  lat?: number;
  lng?: number;
};

type RealtimeData = {
  temperature: number;
  pressure: number;
  flowrate: number;
  powerKw: number;
  massKgph?: number;
  status?: string;
  timestamp?: number;
  index?: number;
};

export default function UserDetail({ deviceId }: { deviceId: string }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [markerIcons, setMarkerIcons] = useState<Record<DeviceMarkerStatus, DivIcon> | null>(null);
  const [flowUnit, setFlowUnit] = useState<FlowUnit>("m3h");
  const [powerUnit, setPowerUnit] = useState<PowerUnit>("kw");
  const [tempUnit] = useState<TempUnit>("c");
  const [pressureUnit, setPressureUnit] = useState<PressureUnit>("kpa");

  useEffect(() => {
    let active = true;
    Promise.all([
      loadDeviceStatusMarkerIcon("online"),
      loadDeviceStatusMarkerIcon("offline"),
    ]).then(([online, offline]) => {
      if (active) setMarkerIcons({ online, offline });
    });
    setMounted(true);

    const interval = window.setInterval(() => setNow(Date.now()), 5_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        const snapshot = await getDocs(
          query(collection(db, "users"), where("deviceId", "==", deviceId), limit(1)),
        );
        setUser((snapshot.docs[0]?.data() as UserData | undefined) ?? null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [deviceId]);

  useEffect(() => {
    const stopTelemetry = watchDeviceTelemetry(deviceId, (value) => {
      setRealtime(
        value
          ? {
              ...value,
            }
          : null,
      );
    });

    return stopTelemetry;
  }, [deviceId]);

  if (loading) {
    return (
      <div className="space-y-4 p-6">
        <div className="h-10 w-56 animate-pulse rounded-md bg-muted" />
        <div className="h-40 animate-pulse rounded-xl border bg-card" />
      </div>
    );
  }

  if (!user) {
    return <p className="p-6 text-sm text-muted-foreground">User tidak ditemukan.</p>;
  }

  const hasLocation = typeof user.lat === "number" && typeof user.lng === "number";
  const googleMapsUrl = hasLocation
    ? `https://www.google.com/maps?q=${user.lat},${user.lng}`
    : "";
  const markerStatus: DeviceMarkerStatus =
    realtime?.timestamp && now - realtime.timestamp <= DEVICE_OFFLINE_TIMEOUT_MS
      ? "online"
      : "offline";

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Device {deviceId}</Badge>
            {realtime?.status?.toLowerCase() === "warning" && (
              <Badge variant="destructive">Sensor warning</Badge>
            )}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Detail perangkat</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitoring realtime dan lokasi instalasi milik {user.fullname}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/user">
              <ArrowLeft className="mr-2 h-4 w-4" /> Daftar user
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informasi pengguna</CardTitle>
          <CardDescription>Identitas pemilik dan lokasi instalasi perangkat.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
          <InfoItem label="Nama" value={user.fullname} />
          <InfoItem label="Email" value={user.email} />
          <div>
            <p className="text-xs text-muted-foreground">Lokasi</p>
            <p className="mt-1 font-medium">{user.locationName || "Belum tersedia"}</p>
            {hasLocation ? (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex text-xs text-primary hover:underline"
              >
                Buka di Google Maps
              </a>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SensorCard
          icon={Wind}
          label="Flowrate"
          value={convertFlow(realtime?.flowrate ?? 0, flowUnit).toFixed(3)}
          unit={flowUnitLabel(flowUnit)}
          tone="text-sky-600 dark:text-sky-300"
          control={
            <select
              value={flowUnit}
              onChange={(event) => setFlowUnit(event.target.value as FlowUnit)}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              <option value="m3h">m³/h</option>
              <option value="lmin">L/min</option>
            </select>
          }
        />
        <SensorCard
          icon={Zap}
          label="Daya biogas"
          value={convertPower(realtime?.powerKw ?? 0, powerUnit).toFixed(3)}
          unit={powerUnitLabel(powerUnit)}
          tone="text-violet-600 dark:text-violet-300"
          control={
            <select
              value={powerUnit}
              onChange={(event) => setPowerUnit(event.target.value as PowerUnit)}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              <option value="kw">kW</option>
              <option value="w">W</option>
            </select>
          }
        />
        <SensorCard
          icon={Thermometer}
          label="Suhu"
          value={convertTemp(realtime?.temperature ?? 0, tempUnit).toFixed(2)}
          unit={`°${tempUnit.toUpperCase()}`}
          tone="text-rose-600 dark:text-rose-300"
        />
        <SensorCard
          icon={Gauge}
          label="Tekanan"
          value={convertPressure(realtime?.pressure ?? 0, pressureUnit).toFixed(3)}
          unit={pressureUnitLabel(pressureUnit)}
          tone="text-amber-600 dark:text-amber-300"
          control={
            <select
              value={pressureUnit}
              onChange={(event) => setPressureUnit(event.target.value as PressureUnit)}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              <option value="kpa">kPa</option>
              <option value="bar">bar</option>
            </select>
          }
        />
        <SensorCard
          icon={Wind}
          label="Laju massa"
          value={realtime?.massKgph === undefined ? "—" : realtime.massKgph.toFixed(3)}
          unit="kg/h"
          tone="text-emerald-600 dark:text-emerald-300"
        />
      </div>

      <LiveTelemetryCharts deviceId={deviceId} />

      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-primary">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base">Lokasi perangkat</CardTitle>
              <CardDescription>Posisi instalasi yang tersimpan pada profil pengguna.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {mounted && hasLocation && markerIcons ? (
            <div className="relative h-[300px] w-full overflow-hidden rounded-lg border">
              <MapContainer
                key={`${user.lat}-${user.lng}`}
                center={[user.lat!, user.lng!]}
                zoom={15}
                scrollWheelZoom={false}
                className="h-full w-full"
              >
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[user.lat!, user.lng!]} icon={markerIcons[markerStatus]}>
                  <Popup>
                    {user.locationName}
                    <br />
                    <span className={markerStatus === "online" ? "text-cyan-600" : "text-rose-600"}>
                      Perangkat {markerStatus === "online" ? "online" : "offline"}
                    </span>
                  </Popup>
                </Marker>
              </MapContainer>
              <div className={`pointer-events-none absolute right-3 top-3 z-[450] flex items-center gap-2 rounded-lg border bg-background/90 px-3 py-2 text-xs font-medium shadow-md backdrop-blur-sm ${markerStatus === "online" ? "text-cyan-700 dark:text-cyan-400" : "text-rose-700 dark:text-rose-400"}`}>
                <span className={`h-2.5 w-2.5 rounded-full ${markerStatus === "online" ? "bg-cyan-500" : "bg-rose-500"}`} />
                {markerStatus === "online" ? "Online" : "Offline"}
              </div>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
              Lokasi belum tersedia.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-medium">{value || "-"}</p>
    </div>
  );
}

function SensorCard({
  icon: Icon,
  label,
  value,
  unit,
  tone,
  control,
}: {
  icon: typeof Wind;
  label: string;
  value: string;
  unit: string;
  tone: string;
  control?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/20 ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
        {control}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </CardContent>
    </Card>
  );
}
