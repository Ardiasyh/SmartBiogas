"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { db } from "@/lib/firebase";

import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { watchDeviceTelemetry } from "@/lib/device-telemetry";
import { getHistoryPage, getHistoryRange, watchRecentHistory, type HistoryPoint } from "@/lib/device-history";
import { hasHistoryRange, historyMode, mergeHistoryPage, toHistoryRange, type HistoryCursor, type HistoryRange } from "@/lib/history-pagination";

import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import ExportExcelButton from "@/components/export/ExportExcelButton";
import { DateRangePicker } from "@/components/ui/date-range-picker";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

import dynamic from "next/dynamic";

const MapContainer = dynamic(
  () =>
    import("react-leaflet").then(
      (m) => m.MapContainer
    ),
  { ssr: false }
);

const TileLayer = dynamic(
  () =>
    import("react-leaflet").then(
      (m) => m.TileLayer
    ),
  { ssr: false }
);

const Marker = dynamic(
  () =>
    import("react-leaflet").then(
      (m) => m.Marker
    ),
  { ssr: false }
);

const Popup = dynamic(
  () =>
    import("react-leaflet").then(
      (m) => m.Popup
    ),
  { ssr: false }
);

import "leaflet/dist/leaflet.css";

import FlowrateChart from "@/components/charts/admin/FlowrateChart";
import PressureChart from "@/components/charts/admin/PressureChart";

/* ================= KONSTANTA ================= */

const F_CH4 = 0.56;
const LHV_CH4 = 35.8;
const MJ_TO_KWH = 1 / 3.6;
const ETA_GEN = 0.08;

function calculateEnergyKwh(flow: number) {
  const V_CH4 = flow * F_CH4;
  const LHV = LHV_CH4 * F_CH4 * MJ_TO_KWH;

  return V_CH4 * LHV * ETA_GEN;
}

/* ================= UNIT ================= */

type FlowUnit = "m3h" | "lmin";
type EnergyUnit = "kwh" | "mj";
type TempUnit = "c" | "f";
type PressureUnit = "kpa" | "bar";

const convertFlow = (
  v: number,
  u: FlowUnit
) => (u === "lmin" ? (v * 1000) / 60 : v);

const convertEnergy = (
  v: number,
  u: EnergyUnit
) => (u === "mj" ? v * 3.6 : v);

const convertTemp = (
  v: number,
  u: TempUnit
) => (u === "f" ? v * 1.8 + 32 : v);

const convertPressure = (
  v: number,
  u: PressureUnit
) => (u === "bar" ? v / 100 : v);

/* ================= TYPES ================= */

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

const HISTORY_PAGE_SIZE = 100;

export default function UserDetail({
  deviceId,
}: {
  deviceId: string;
}) {
  const [user, setUser] =
    useState<UserData | null>(null);

  const [realtime, setRealtime] =
    useState<RealtimeData | null>(null);

  const [history, setHistory] =
    useState<(RealtimeData & HistoryPoint)[]>([]);

  const [historyCursor, setHistoryCursor] =
    useState<HistoryCursor | null>(null);

  const [hasOlderHistory, setHasOlderHistory] =
    useState(false);

  const [loadingHistory, setLoadingHistory] =
    useState(false);

  const [historyError, setHistoryError] =
    useState<string | null>(null);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [historyRange, setHistoryRange] = useState<HistoryRange>({});
  const expandedHistory = useRef(false);

  const [loading, setLoading] =
    useState(true);

  const [mounted, setMounted] =
    useState(false);

  const [flowUnit, setFlowUnit] =
    useState<FlowUnit>("m3h");

  const [energyUnit, setEnergyUnit] =
    useState<EnergyUnit>("kwh");

  const [tempUnit] =
    useState<TempUnit>("c");

  const [pressureUnit, setPressureUnit] =
    useState<PressureUnit>("kpa");

  /* ================= LEAFLET FIX ================= */

  useEffect(() => {
    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl;

      L.Icon.Default.mergeOptions({
        iconUrl: "/leaflet/marker-icon.png",
        iconRetinaUrl:
          "/leaflet/marker-icon-2x.png",
        shadowUrl:
          "/leaflet/marker-shadow.png",
      });
    });
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  /* ================= FETCH USER ================= */

  useEffect(() => {
    const run = async () => {
      const snap = await getDocs(query(collection(db, "users"), where("deviceId", "==", deviceId), limit(1)));
      setUser(snap.docs[0]?.data() as UserData | undefined ?? null);

      setLoading(false);
    };

    run();
  }, [deviceId]);

  /* ================= REALTIME + HISTORY ================= */

  useEffect(() => {
    let cancelled = false;
    setLoadingHistory(true);
    setHistory([]);
    setHistoryCursor(null);
    setHasOlderHistory(false);
    setHistoryError(null);

    const mode = historyMode(historyRange);
    expandedHistory.current = false;
    const format = (page: HistoryPoint[]) => page.map((point) => ({ ...point, energy: point.energy || calculateEnergyKwh(point.flowrate) }));
    const receiveLiveHistory = (page: HistoryPoint[]) => {
      if (cancelled) return;
      const formatted = format(page);
      setHistory((current) => (expandedHistory.current ? mergeHistoryPage(current, formatted) : formatted).map((point, index) => ({ ...point, index: index + 1 })));
      setHistoryCursor((current) => expandedHistory.current ? current ?? page[0] ?? null : page[0] ?? null);
      setHasOlderHistory(page.length === HISTORY_PAGE_SIZE);
      setLoadingHistory(false);
    };
    const stopHistory = mode === "live"
      ? watchRecentHistory(deviceId, receiveLiveHistory, (error) => {
          if (!cancelled) {
            setHistoryError(error.message);
            setLoadingHistory(false);
          }
        }, HISTORY_PAGE_SIZE)
      : undefined;

    if (mode === "range") {
      getHistoryRange(deviceId, historyRange).then((page) => {
        if (cancelled) return;
        setHistory(format(page).map((point, index) => ({ ...point, index: index + 1 })));
        setHistoryCursor(page[0] ?? null);
        setHasOlderHistory(false);
      }).catch((error: unknown) => {
        if (!cancelled) setHistoryError(error instanceof Error ? error.message : "Gagal memuat histori.");
      }).finally(() => !cancelled && setLoadingHistory(false));
    }

    const stopTelemetry = watchDeviceTelemetry(deviceId, (value) => {
      setRealtime(value ? { ...value, energy: value.energy || calculateEnergyKwh(value.flowrate) } : null);
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
      const page = await getHistoryPage(deviceId, historyCursor, HISTORY_PAGE_SIZE, historyRange);
      const formatted = page.map((point) => ({ ...point, energy: point.energy || calculateEnergyKwh(point.flowrate) }));
      expandedHistory.current = true;
      setHistory((current) => mergeHistoryPage(current, formatted).map((point, index) => ({ ...point, index: index + 1 })));
      setHistoryCursor(page[0] ?? historyCursor);
      setHasOlderHistory(page.length === HISTORY_PAGE_SIZE);
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "Gagal memuat histori.");
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

  /* ================= CHART DATA ================= */

  const chartData = useMemo(() => {
    return history.map((d) => ({
      ...d,

      energyConverted:
        convertEnergy(
          d.energy,
          energyUnit
        ),
    }));
  }, [history, energyUnit]);

  /* ================= LOADING ================= */

  if (loading)
    return (
      <p className="p-6">
        Loading...
      </p>
    );

  if (!user)
    return (
      <p className="p-6">
        User tidak ditemukan
      </p>
    );

  /* ================= LOCATION ================= */

  const hasLocation =
    typeof user.lat === "number" &&
    typeof user.lng === "number";

  const googleMapsUrl = hasLocation
    ? `https://www.google.com/maps?q=${user.lat},${user.lng}`
    : "";

  return (
    <div className="p-6 space-y-6">

      {/* ACTION BUTTON */}
      <div className="flex flex-wrap gap-3">

        <Link href="/admin/user">
          <Button
            variant="secondary"
            className="rounded-xl px-4 shadow-sm hover:shadow-md transition-all"
          >
            ← Kembali ke Daftar User
          </Button>
        </Link>

        <ExportExcelButton
          history={history}
          deviceId={deviceId}
        />

        <DateRangePicker from={fromDate} to={toDate} onApply={applyDateRange} />

        {!hasHistoryRange(historyRange) && (
          <Button
            variant="outline"
            disabled={!hasOlderHistory || loadingHistory}
            onClick={loadOlderHistory}
          >
            {loadingHistory ? "Memuat..." : hasOlderHistory ? "Muat data lebih lama" : "Semua histori dimuat"}
          </Button>
        )}

      </div>

      {historyError && (
        <p className="text-sm text-destructive">Histori gagal dimuat: {historyError}</p>
      )}

      {/* USER INFO */}
      <Card>
        <CardHeader>
          <CardTitle>
            Informasi User
          </CardTitle>
        </CardHeader>

        <CardContent className="text-sm space-y-1">

          <p>
            <b>Nama:</b>{" "}
            {user.fullname}
          </p>

          <p>
            <b>Email:</b>{" "}
            {user.email}
          </p>

          <p>
            <b>Lokasi:</b>{" "}
            {user.locationName}
          </p>

          {hasLocation && (
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline text-xs"
            >
              Buka di Google Maps
            </a>
          )}

        </CardContent>
      </Card>

      {/* REALTIME */}
      <Card>
        <CardHeader>
          <CardTitle>
            Realtime Sensor
          </CardTitle>
        </CardHeader>

        <CardContent className="grid grid-cols-2 gap-6 text-sm">

          {/* FLOWRATE */}
          <div className="flex justify-between items-center">

            <div>
              <b>Flowrate</b>
              <br />

              {convertFlow(
                realtime?.flowrate ?? 0,
                flowUnit
              ).toFixed(3)}
            </div>

            <select
              value={flowUnit}
              onChange={(e) =>
                setFlowUnit(
                  e.target
                    .value as FlowUnit
                )
              }
              className="border bg-background p-1 rounded"
            >
              <option value="m3h">
                m³/h
              </option>

              <option value="lmin">
                L/min
              </option>
            </select>

          </div>

          {/* ENERGY */}
          <div className="flex justify-between items-center">

            <div>
              <b>Energi</b>
              <br />

              {convertEnergy(
                realtime?.energy ?? 0,
                energyUnit
              ).toFixed(3)}
            </div>

            <select
              value={energyUnit}
              onChange={(e) =>
                setEnergyUnit(
                  e.target
                    .value as EnergyUnit
                )
              }
              className="border bg-background p-1 rounded"
            >
              <option value="kwh">
                kWh
              </option>

              <option value="mj">
                MJ
              </option>
            </select>

          </div>

          {/* TEMPERATURE */}
          <div>
            <b>Suhu</b>
            <br />

            {convertTemp(
              realtime?.temperature ?? 0,
              tempUnit
            ).toFixed(2)}{" "}
            °{tempUnit.toUpperCase()}
          </div>

          {/* PRESSURE */}
          <div className="flex justify-between items-center">

            <div>
              <b>Tekanan</b>
              <br />

              {convertPressure(
                realtime?.pressure ?? 0,
                pressureUnit
              ).toFixed(3)}
            </div>

            <select
              value={pressureUnit}
              onChange={(e) =>
                setPressureUnit(
                  e.target
                    .value as PressureUnit
                )
              }
              className="border bg-background p-1 rounded"
            >
              <option value="kpa">
                kPa
              </option>

              <option value="bar">
                Bar
              </option>
            </select>

          </div>

        </CardContent>
      </Card>

      {/* ENERGY CHART */}
      <Card>
        <CardHeader>
          <CardTitle>
            Grafik Energi (
            {energyUnit})
          </CardTitle>
        </CardHeader>

        <CardContent className="h-72">

          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <AreaChart
              data={chartData}
            >
              <defs>
                <linearGradient
                  id="energyGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#22c55e"
                    stopOpacity={0.8}
                  />

                  <stop
                    offset="100%"
                    stopColor="#22c55e"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                opacity={0.15}
              />

              <XAxis dataKey="index" />

              <YAxis />

              <Tooltip />

              <Area
                type="monotone"
                dataKey="energyConverted"
                stroke="#16a34a"
                strokeWidth={2.5}
                fill="url(#energyGradient)"
              />

            </AreaChart>
          </ResponsiveContainer>

        </CardContent>
      </Card>

      {/* FLOWRATE CHART */}
      <Card>
        <CardHeader>
          <CardTitle>
            Grafik Flowrate (
            {flowUnit})
          </CardTitle>
        </CardHeader>

        <CardContent>
          <FlowrateChart
            data={history}
            unit={flowUnit}
          />
        </CardContent>
      </Card>

      {/* PRESSURE CHART */}
      <Card>
        <CardHeader>
          <CardTitle>
            Grafik Tekanan (
            {pressureUnit})
          </CardTitle>
        </CardHeader>

        <CardContent>
          <PressureChart
            data={history}
            unit={pressureUnit}
          />
        </CardContent>
      </Card>

      {/* MAP */}
      <Card>

        <CardHeader>
          <CardTitle>
            Lokasi Perangkat
          </CardTitle>
        </CardHeader>

        <CardContent>

          {mounted && hasLocation ? (

            <div className="h-[300px] w-full rounded overflow-hidden">

              <MapContainer
                key={`${user.lat}-${user.lng}`}
                center={[
                  user.lat!,
                  user.lng!,
                ]}
                zoom={15}
                scrollWheelZoom={false}
                className="h-full w-full"
              >

                {mounted && (
                  <>
                    <TileLayer
                      attribution='&copy; OpenStreetMap contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    <Marker
                      position={[
                        user.lat!,
                        user.lng!,
                      ]}
                    >
                      <Popup>
                        {user.locationName}
                      </Popup>
                    </Marker>
                  </>
                )}

              </MapContainer>

            </div>

          ) : (
            <p className="text-sm text-muted-foreground">
              Lokasi belum tersedia
            </p>
          )}

        </CardContent>

      </Card>

    </div>
  );
}
