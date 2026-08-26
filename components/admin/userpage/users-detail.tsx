"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { Activity, ArrowLeft, Gauge, MapPin, Thermometer, Wind, Zap } from "lucide-react";

import { db } from "@/lib/firebase";
import { watchDeviceTelemetry } from "@/lib/device-telemetry";
import {
  getHistoryPage,
  getHistoryRange,
  watchRecentHistory,
  type HistoryPoint,
} from "@/lib/device-history";
import {
  hasHistoryRange,
  historyMode,
  mergeHistoryPage,
  toHistoryRange,
  type HistoryCursor,
  type HistoryRange,
} from "@/lib/history-pagination";
import ExportExcelButton from "@/components/export/ExportExcelButton";
import EnergyChart from "@/components/charts/admin/EnergyChart";
import FlowrateChart from "@/components/charts/admin/FlowrateChart";
import PressureChart from "@/components/charts/admin/PressureChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DateRangePicker } from "@/components/ui/date-range-picker";

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

const F_CH4 = 0.56;
const LHV_CH4 = 35.8;
const MJ_TO_KWH = 1 / 3.6;
const ETA_GEN = 0.08;
const HISTORY_PAGE_SIZE = 100;

function calculateEnergyKwh(flow: number) {
  const methaneVolume = flow * F_CH4;
  const lhv = LHV_CH4 * F_CH4 * MJ_TO_KWH;
  return methaneVolume * lhv * ETA_GEN;
}

type FlowUnit = "m3h" | "lmin";
type EnergyUnit = "kwh" | "mj";
type TempUnit = "c" | "f";
type PressureUnit = "kpa" | "bar";

const convertFlow = (value: number, unit: FlowUnit) =>
  unit === "lmin" ? (value * 1000) / 60 : value;
const convertEnergy = (value: number, unit: EnergyUnit) =>
  unit === "mj" ? value * 3.6 : value;
const convertTemp = (value: number, unit: TempUnit) =>
  unit === "f" ? value * 1.8 + 32 : value;
const convertPressure = (value: number, unit: PressureUnit) =>
  unit === "bar" ? value / 100 : value;

const flowUnitLabel = (unit: FlowUnit) => (unit === "lmin" ? "L/min" : "m³/h");
const energyUnitLabel = (unit: EnergyUnit) => (unit === "mj" ? "MJ" : "kWh");
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
  energy: number;
  timestamp?: number;
  index?: number;
};

export default function UserDetail({ deviceId }: { deviceId: string }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [history, setHistory] = useState<(RealtimeData & HistoryPoint)[]>([]);
  const [historyCursor, setHistoryCursor] = useState<HistoryCursor | null>(null);
  const [hasOlderHistory, setHasOlderHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [historyRange, setHistoryRange] = useState<HistoryRange>({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [flowUnit, setFlowUnit] = useState<FlowUnit>("m3h");
  const [energyUnit, setEnergyUnit] = useState<EnergyUnit>("kwh");
  const [tempUnit] = useState<TempUnit>("c");
  const [pressureUnit, setPressureUnit] = useState<PressureUnit>("kpa");
  const expandedHistory = useRef(false);

  useEffect(() => {
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "/leaflet/marker-icon.png",
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });
    });
    setMounted(true);
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
    let cancelled = false;
    setLoadingHistory(true);
    setHistory([]);
    setHistoryCursor(null);
    setHasOlderHistory(false);
    setHistoryError(null);

    const mode = historyMode(historyRange);
    expandedHistory.current = false;

    const format = (page: HistoryPoint[]) =>
      page.map((point) => ({
        ...point,
        energy: point.energy || calculateEnergyKwh(point.flowrate),
      }));

    const receiveLiveHistory = (page: HistoryPoint[]) => {
      if (cancelled) return;
      const formatted = format(page);

      setHistory((current) =>
        (expandedHistory.current ? mergeHistoryPage(current, formatted) : formatted).map(
          (point, index) => ({ ...point, index: index + 1 }),
        ),
      );
      setHistoryCursor((current) =>
        expandedHistory.current ? current ?? page[0] ?? null : page[0] ?? null,
      );
      setHasOlderHistory(page.length === HISTORY_PAGE_SIZE);
      setLoadingHistory(false);
    };

    const stopHistory =
      mode === "live"
        ? watchRecentHistory(
            deviceId,
            receiveLiveHistory,
            (error) => {
              if (!cancelled) {
                setHistoryError(error.message);
                setLoadingHistory(false);
              }
            },
            HISTORY_PAGE_SIZE,
          )
        : undefined;

    if (mode === "range") {
      getHistoryRange(deviceId, historyRange)
        .then((page) => {
          if (cancelled) return;
          setHistory(
            format(page).map((point, index) => ({ ...point, index: index + 1 })),
          );
          setHistoryCursor(page[0] ?? null);
          setHasOlderHistory(false);
        })
        .catch((error: unknown) => {
          if (!cancelled) {
            setHistoryError(
              error instanceof Error ? error.message : "Gagal memuat histori.",
            );
          }
        })
        .finally(() => {
          if (!cancelled) setLoadingHistory(false);
        });
    }

    const stopTelemetry = watchDeviceTelemetry(deviceId, (value) => {
      setRealtime(
        value
          ? {
              ...value,
              energy: value.energy || calculateEnergyKwh(value.flowrate),
            }
          : null,
      );
    });

    return () => {
      cancelled = true;
      stopHistory?.();
      stopTelemetry();
    };
  }, [deviceId, historyRange]);

  const loadOlderHistory = async () => {
    if (!historyCursor || loadingHistory) return;
    setLoadingHistory(true);

    try {
      const page = await getHistoryPage(
        deviceId,
        historyCursor,
        HISTORY_PAGE_SIZE,
        historyRange,
      );
      const formatted = page.map((point) => ({
        ...point,
        energy: point.energy || calculateEnergyKwh(point.flowrate),
      }));

      expandedHistory.current = true;
      setHistory((current) =>
        mergeHistoryPage(current, formatted).map((point, index) => ({
          ...point,
          index: index + 1,
        })),
      );
      setHistoryCursor(page[0] ?? historyCursor);
      setHasOlderHistory(page.length === HISTORY_PAGE_SIZE);
    } catch (error) {
      setHistoryError(
        error instanceof Error ? error.message : "Gagal memuat histori.",
      );
    } finally {
      setLoadingHistory(false);
    }
  };

  const applyDateRange = (from: string, to: string) => {
    const range = toHistoryRange(from, to);
    if (!range) {
      setHistoryError("Tanggal mulai harus sebelum tanggal selesai.");
      return;
    }

    setFromDate(from);
    setToDate(to);
    setHistoryRange(range);
  };

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

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Device {deviceId}</Badge>
            <Badge variant="outline">{history.length} data histori</Badge>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Detail perangkat</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitoring realtime, histori sensor, dan lokasi instalasi milik {user.fullname}.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/user">
              <ArrowLeft className="mr-2 h-4 w-4" /> Daftar user
            </Link>
          </Button>
          <ExportExcelButton history={history} deviceId={deviceId} />
          <DateRangePicker from={fromDate} to={toDate} onApply={applyDateRange} />
          {!hasHistoryRange(historyRange) && (
            <Button
              variant="outline"
              disabled={!hasOlderHistory || loadingHistory}
              onClick={loadOlderHistory}
            >
              {loadingHistory
                ? "Memuat..."
                : hasOlderHistory
                  ? "Muat data lama"
                  : "Semua histori dimuat"}
            </Button>
          )}
        </div>
      </div>

      {historyError ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Histori gagal dimuat: {historyError}
        </div>
      ) : null}

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          label="Energi"
          value={convertEnergy(realtime?.energy ?? 0, energyUnit).toFixed(3)}
          unit={energyUnitLabel(energyUnit)}
          tone="text-violet-600 dark:text-violet-300"
          control={
            <select
              value={energyUnit}
              onChange={(event) => setEnergyUnit(event.target.value as EnergyUnit)}
              className="h-8 rounded-md border bg-background px-2 text-xs"
            >
              <option value="kwh">kWh</option>
              <option value="mj">MJ</option>
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
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          <div>
            <h2 className="font-medium">Histori sensor</h2>
            <p className="text-xs text-muted-foreground">
              Semua grafik menggunakan komponen chart shadcn yang sama agar skala, tooltip, dan dark mode konsisten.
            </p>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-base">Energi</CardTitle>
            <CardDescription>Perubahan energi dalam {energyUnitLabel(energyUnit)}.</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <EnergyChart data={history} unit={energyUnit} />
          </CardContent>
        </Card>

        <div className="grid gap-6 xl:grid-cols-2">
          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-base">Flowrate</CardTitle>
              <CardDescription>Perubahan flowrate dalam {flowUnitLabel(flowUnit)}.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <FlowrateChart data={history} unit={flowUnit} />
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="text-base">Tekanan</CardTitle>
              <CardDescription>Perubahan tekanan dalam {pressureUnitLabel(pressureUnit)}.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <PressureChart data={history} unit={pressureUnit} />
            </CardContent>
          </Card>
        </div>
      </section>

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
          {mounted && hasLocation ? (
            <div className="h-[300px] w-full overflow-hidden rounded-lg border">
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
                <Marker position={[user.lat!, user.lng!]}>
                  <Popup>{user.locationName}</Popup>
                </Marker>
              </MapContainer>
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
