"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  Activity,
  BatteryCharging,
  Users,
  Wifi,
  WifiOff,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { db } from "@/lib/firebase";
import { watchDeviceTelemetry } from "@/lib/device-telemetry";
import { watchRecentHistory, type HistoryPoint } from "@/lib/device-history";
import type { Telemetry } from "@/lib/telemetry";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const OFFLINE_THRESHOLD = 15000;
const HISTORY_LIMIT_PER_DEVICE = 20;

type EnergyUnit = "kwh" | "mj";

type RawLog = {
  timestamp: number;
  energy: number;
};

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function convertEnergy(value: number, unit: EnergyUnit) {
  return unit === "mj" ? value * 3.6 : value;
}

export default function AdminDashboardOverview() {
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [onlineDevices, setOnlineDevices] = useState(0);
  const [offlineDevices, setOfflineDevices] = useState(0);
  const [rawLogs, setRawLogs] = useState<RawLog[]>([]);
  const [energyUnit, setEnergyUnit] = useState<EnergyUnit>("kwh");

  const chartData = useMemo(
    () =>
      rawLogs.map((log) => ({
        time: formatTime(log.timestamp),
        energy: convertEnergy(log.energy, energyUnit),
      })),
    [rawLogs, energyUnit],
  );

  useEffect(() => {
    const telemetry = new Map<string, Telemetry | null>();
    const histories = new Map<string, HistoryPoint[]>();
    const telemetryStops = new Map<string, () => void>();
    const historyStops = new Map<string, () => void>();

    const refreshRealtime = () => {
      const values = [...telemetry.values()].filter(
        (value): value is Telemetry => value !== null,
      );

      const now = Date.now();
      const online = values.filter(
        (value) => now - value.timestamp <= OFFLINE_THRESHOLD,
      ).length;

      setTotalEnergy(
        values.reduce((total, value) => total + Number(value.energy || 0), 0),
      );
      setOnlineDevices(online);
      setOfflineDevices(Math.max(0, telemetryStops.size - online));
    };

    const refreshHistory = () => {
      const merged = [...histories.values()]
        .flat()
        .map(({ timestamp, energy }) => ({
          timestamp,
          energy: Number(energy || 0),
        }))
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(-20);

      setRawLogs(merged);
    };

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snap) => {
      const deviceIds = new Set(
        snap.docs
          .map((document) => document.data().deviceId)
          .filter(
            (value): value is string =>
              typeof value === "string" && value.trim().length > 0,
          ),
      );

      setActiveUsers(deviceIds.size);

      telemetryStops.forEach((stop, deviceId) => {
        if (deviceIds.has(deviceId)) return;
        stop();
        telemetryStops.delete(deviceId);
        telemetry.delete(deviceId);
      });

      historyStops.forEach((stop, deviceId) => {
        if (deviceIds.has(deviceId)) return;
        stop();
        historyStops.delete(deviceId);
        histories.delete(deviceId);
      });

      deviceIds.forEach((deviceId) => {
        if (!telemetryStops.has(deviceId)) {
          telemetryStops.set(
            deviceId,
            watchDeviceTelemetry(deviceId, (value) => {
              telemetry.set(deviceId, value);
              refreshRealtime();
            }),
          );
        }

        if (!historyStops.has(deviceId)) {
          historyStops.set(
            deviceId,
            watchRecentHistory(
              deviceId,
              (history) => {
                histories.set(deviceId, history);
                refreshHistory();
              },
              (error) => {
                console.error(`[RTDB] Gagal membaca logs device ${deviceId}:`, error);
                histories.set(deviceId, []);
                refreshHistory();
              },
              HISTORY_LIMIT_PER_DEVICE,
            ),
          );
        }
      });

      refreshRealtime();
      refreshHistory();
    });

    const interval = window.setInterval(refreshRealtime, 5_000);

    return () => {
      unsubscribeUsers();
      window.clearInterval(interval);
      telemetryStops.forEach((stop) => stop());
      historyStops.forEach((stop) => stop());
      telemetryStops.clear();
      historyStops.clear();
      telemetry.clear();
      histories.clear();
    };
  }, []);

  const displayEnergy = convertEnergy(totalEnergy, energyUnit);
  const totalDevices = onlineDevices + offlineDevices;
  const onlinePercent = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;

  const pieData = [
    { name: "Online", value: onlineDevices },
    { name: "Offline", value: offlineDevices },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-card/75 p-6 shadow-[0_20px_70px_-40px_rgba(22,163,74,0.4)] backdrop-blur-xl"
      >
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1.5 text-xs font-bold text-primary">
              <Activity className="h-3.5 w-3.5" />
              Live system overview
            </div>
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Kondisi sistem saat ini</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Ringkasan energi, pengguna, dan konektivitas perangkat yang diperbarui otomatis dari Firebase.
            </p>
          </div>

          <div className="flex w-fit items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-emerald-700 dark:text-emerald-300">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
            </span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">System health</p>
              <p className="text-sm font-bold">{onlinePercent}% perangkat online</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          index={0}
          title="Total Energi Sistem"
          value={displayEnergy.toFixed(3)}
          unit={energyUnit === "kwh" ? "kWh" : "MJ"}
          helper="Akumulasi nilai realtime seluruh device"
          icon={Zap}
          tone="emerald"
          extra={
            <select
              value={energyUnit}
              onChange={(event) => setEnergyUnit(event.target.value as EnergyUnit)}
              className="rounded-xl border border-border/70 bg-background/70 px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
            >
              <option value="kwh">kWh</option>
              <option value="mj">MJ</option>
            </select>
          }
        />
        <MetricCard
          index={1}
          title="User Aktif"
          value={activeUsers}
          helper="User dengan device terdaftar"
          icon={Users}
          tone="violet"
        />
        <MetricCard
          index={2}
          title="Device Online"
          value={onlineDevices}
          helper="Update diterima dalam 15 detik"
          icon={Wifi}
          tone="sky"
        />
        <MetricCard
          index={3}
          title="Device Offline"
          value={offlineDevices}
          helper="Device tanpa update terbaru"
          icon={WifiOff}
          tone="rose"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.75fr)]">
        <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-card/75 shadow-[0_20px_60px_-42px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b border-border/60 pb-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Energy analytics</p>
              <CardTitle className="mt-1 text-xl">Trend energi terbaru</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">20 data history terakhir dari seluruh perangkat</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BatteryCharging className="h-5 w-5" />
            </div>
          </CardHeader>

          <CardContent className="h-[360px] px-2 pb-4 pt-6 sm:px-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
                <defs>
                  <linearGradient id="adminEnergyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.42} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="4 4" vertical={false} opacity={0.08} />
                <XAxis
                  dataKey="time"
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  minTickGap={24}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={11}
                  width={58}
                />
                <Tooltip
                  cursor={{ strokeDasharray: "4 4", strokeOpacity: 0.25 }}
                  contentStyle={{
                    borderRadius: 16,
                    border: "1px solid rgba(148,163,184,.2)",
                    background: "rgba(15,23,42,.92)",
                    color: "white",
                    boxShadow: "0 18px 50px -20px rgba(0,0,0,.6)",
                  }}
                  formatter={(value) => [
                    `${Number(value).toFixed(3)} ${energyUnit === "kwh" ? "kWh" : "MJ"}`,
                    "Energi",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="energy"
                  stroke="#22c55e"
                  fill="url(#adminEnergyGradient)"
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="overflow-hidden rounded-[2rem] border-border/70 bg-card/75 shadow-[0_20px_60px_-42px_rgba(0,0,0,0.5)] backdrop-blur-xl">
          <CardHeader className="border-b border-border/60 pb-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Connectivity</p>
            <CardTitle className="mt-1 text-xl">Status perangkat</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">Distribusi device online dan offline</p>
          </CardHeader>

          <CardContent className="flex min-h-[360px] flex-col items-center justify-center p-5">
            <div className="relative h-[220px] w-full max-w-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={64}
                    outerRadius={90}
                    paddingAngle={5}
                    cornerRadius={10}
                    stroke="none"
                  >
                    <Cell fill="#22c55e" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 14,
                      border: "1px solid rgba(148,163,184,.2)",
                      background: "rgba(15,23,42,.92)",
                      color: "white",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-black tracking-tight">{totalDevices}</p>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Devices</p>
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-3">
              <StatusLegend label="Online" value={onlineDevices} dotClassName="bg-emerald-500" />
              <StatusLegend label="Offline" value={offlineDevices} dotClassName="bg-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  index,
  title,
  value,
  unit,
  helper,
  icon: Icon,
  tone,
  extra,
}: {
  index: number;
  title: string;
  value: number | string;
  unit?: string;
  helper: string;
  icon: LucideIcon;
  tone: "emerald" | "violet" | "sky" | "rose";
  extra?: React.ReactNode;
}) {
  const toneClasses = {
    emerald: {
      icon: "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400",
      glow: "bg-emerald-400/10",
    },
    violet: {
      icon: "bg-violet-500/12 text-violet-600 dark:text-violet-400",
      glow: "bg-violet-400/10",
    },
    sky: {
      icon: "bg-sky-500/12 text-sky-600 dark:text-sky-400",
      glow: "bg-sky-400/10",
    },
    rose: {
      icon: "bg-rose-500/12 text-rose-600 dark:text-rose-400",
      glow: "bg-rose-400/10",
    },
  }[tone];

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/75 p-5 shadow-[0_16px_50px_-34px_rgba(0,0,0,0.5)] backdrop-blur-xl"
    >
      <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl ${toneClasses.glow}`} />

      <div className="relative flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
        {extra}
      </div>

      <div className="relative mt-5">
        <p className="text-sm font-semibold text-muted-foreground">{title}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <motion.span
            key={String(value)}
            initial={{ opacity: 0.5, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black tracking-tight"
          >
            {value}
          </motion.span>
          {unit && <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{unit}</span>}
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground/80">{helper}</p>
      </div>
    </motion.article>
  );
}

function StatusLegend({
  label,
  value,
  dotClassName,
}: {
  label: string;
  value: number;
  dotClassName: string;
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/55 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className={`h-2.5 w-2.5 rounded-full ${dotClassName}`} />
        {label}
      </div>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}
