"use client";

import { useEffect, useState, useMemo } from "react";
import { db, rtdb } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { ref, onValue, query, limitToLast } from "firebase/database";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
const MapContainer = dynamic(() => import("react-leaflet").then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import("react-leaflet").then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import("react-leaflet").then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import("react-leaflet").then(m => m.Popup), { ssr: false });

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

const convertFlow = (v: number, u: FlowUnit) =>
  u === "lmin" ? (v * 1000) / 60 : v;

const convertEnergy = (v: number, u: EnergyUnit) =>
  u === "mj" ? v * 3.6 : v;

const convertTemp = (v: number, u: TempUnit) =>
  u === "f" ? v * 1.8 + 32 : v;

const convertPressure = (v: number, u: PressureUnit) =>
  u === "bar" ? v / 100 : v;

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
  index?: number;
};

export default function UserDetail({ deviceId }: { deviceId: string }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [realtime, setRealtime] = useState<RealtimeData | null>(null);
  const [history, setHistory] = useState<RealtimeData[]>([]);
  const [loading, setLoading] = useState(true);

  const [flowUnit, setFlowUnit] = useState<FlowUnit>("m3h");
  const [energyUnit, setEnergyUnit] = useState<EnergyUnit>("kwh");
  const [tempUnit] = useState<TempUnit>("c");
  const [pressureUnit, setPressureUnit] = useState<PressureUnit>("kpa");

  useEffect(() => {
    import("leaflet").then(L => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "/leaflet/marker-icon.png",
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });
    });
  }, []);

  /* FETCH USER */
  useEffect(() => {
    const run = async () => {
      const snap = await getDocs(collection(db, "users"));
      snap.forEach(doc => {
        if (doc.data().deviceId === deviceId) {
          setUser(doc.data() as UserData);
        }
      });
      setLoading(false);
    };
    run();
  }, [deviceId]);

  /* REALTIME + HISTORY */
  useEffect(() => {
    const logsRef = query(
      ref(rtdb, `biogasData/${deviceId}/logs`),
      limitToLast(40)
    );

    return onValue(logsRef, snap => {
      const data = snap.val();
      if (!data) return;

      const arr = Object.values(data) as any[];

      const formatted = arr.map((d, i) => ({
        temperature: d.temperature ?? 0,
        pressure: d.pressure ?? 0,
        flowrate: d.flowrate ?? 0,
        energy: d.energy ?? calculateEnergyKwh(d.flowrate ?? 0),
        index: i + 1,
      }));

      setHistory(formatted);
      setRealtime(formatted[formatted.length - 1]);
    });
  }, [deviceId]);

  const chartData = useMemo(() => {
    return history.map(d => ({
      ...d,
      energyConverted: convertEnergy(d.energy, energyUnit),
    }));
  }, [history, energyUnit]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!user) return <p className="p-6">User tidak ditemukan</p>;

  const hasLocation =
    typeof user.lat === "number" &&
    typeof user.lng === "number";

  const googleMapsUrl = hasLocation
    ? `https://www.google.com/maps?q=${user.lat},${user.lng}`
    : "";

  return (
    <div className="p-6 space-y-6">

      {/* BUTTON BACK */}
      <div>
        <Link href="/admin/user">
          <Button
            variant="secondary"
            className="rounded-xl px-4 shadow-sm hover:shadow-md transition-all"
          >
            ← Kembali ke Daftar User
          </Button>
        </Link>
      </div>

      {/* USER INFO */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi User</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p><b>Nama:</b> {user.fullname}</p>
          <p><b>Email:</b> {user.email}</p>
          <p><b>Lokasi:</b> {user.locationName}</p>

          {hasLocation && (
            <a
              href={googleMapsUrl}
              target="_blank"
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
          <CardTitle>Realtime Sensor</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-6 text-sm">

          <div className="flex justify-between items-center">
            <div>
              <b>Flowrate</b><br />
              {convertFlow(realtime?.flowrate ?? 0, flowUnit).toFixed(3)}
            </div>
            <select value={flowUnit} onChange={e => setFlowUnit(e.target.value as FlowUnit)} className="border bg-background p-1 rounded">
              <option value="m3h">m³/h</option>
              <option value="lmin">L/min</option>
            </select>
          </div>

          <div className="flex justify-between items-center">
            <div>
              <b>Energi</b><br />
              {convertEnergy(realtime?.energy ?? 0, energyUnit).toFixed(3)}
            </div>
            <select value={energyUnit} onChange={e => setEnergyUnit(e.target.value as EnergyUnit)} className="border bg-background p-1 rounded">
              <option value="kwh">kWh</option>
              <option value="mj">MJ</option>
            </select>
          </div>

          <div>
            <b>Suhu</b><br />
            {convertTemp(realtime?.temperature ?? 0, tempUnit).toFixed(2)} °{tempUnit.toUpperCase()}
          </div>

          <div className="flex justify-between items-center">
            <div>
              <b>Tekanan</b><br />
              {convertPressure(realtime?.pressure ?? 0, pressureUnit).toFixed(3)}
            </div>
            <select value={pressureUnit} onChange={e => setPressureUnit(e.target.value as PressureUnit)} className="border bg-background p-1 rounded">
              <option value="kpa">kPa</option>
              <option value="bar">Bar</option>
            </select>
          </div>

        </CardContent>
      </Card>

      {/* CHART */}
      <Card>
        <CardHeader>
          <CardTitle>Grafik Energi ({energyUnit})</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.8}/>
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
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
          <CardTitle>Grafik Flowrate ({flowUnit})</CardTitle>
        </CardHeader>
        <CardContent>
          <FlowrateChart data={history} unit={flowUnit} />
        </CardContent>
      </Card>

      {/* PRESSURE CHART */}
      <Card>
        <CardHeader>
          <CardTitle>Grafik Tekanan ({pressureUnit})</CardTitle>
        </CardHeader>
        <CardContent>
          <PressureChart data={history} unit={pressureUnit} />
        </CardContent>
      </Card>

      {/* MAP */}
      <Card>
        <CardHeader>
          <CardTitle>Lokasi Perangkat</CardTitle>
        </CardHeader>
        <CardContent>
          {hasLocation ? (
            <div className="h-[300px] w-full rounded overflow-hidden">
              <MapContainer
                center={[user.lat!, user.lng!]}
                zoom={15}
                scrollWheelZoom={false}
                className="h-full w-full"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[user.lat!, user.lng!]}>
                  <Popup>{user.locationName}</Popup>
                </Marker>
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