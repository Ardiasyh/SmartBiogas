"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { db } from "@/lib/firebase";
import { watchDeviceTelemetry } from "@/lib/device-telemetry";
import { watchRecentHistory, type HistoryPoint } from "@/lib/device-history";
import type { Telemetry } from "@/lib/telemetry";
import EmissionComparisonCard from "@/components/impact/EmissionComparisonCard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const OFFLINE_THRESHOLD = 15_000;
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
  });
}

function convertEnergy(value: number, unit: EnergyUnit) {
  return unit === "mj" ? value * 3.6 : value;
}

export default function AdminDashboardOverview() {
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [totalFlowRate, setTotalFlowRate] = useState(0);
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
      const onlineValues = values.filter(
        (value) => now - value.timestamp <= OFFLINE_THRESHOLD,
      );
      const online = onlineValues.length;

      setTotalEnergy(
        values.reduce((total, value) => total + Number(value.energy || 0), 0),
      );
      setTotalFlowRate(
        onlineValues.reduce((total, value) => total + Number(value.flowrate || 0), 0),
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

    const unsubscribeUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      const deviceIds = new Set(
        snapshot.docs
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
      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <CardTitle className="text-xl">Kondisi sistem saat ini</CardTitle>
              <Badge variant="secondary" className="gap-1.5 font-normal">
                <Activity className="h-3 w-3" /> Realtime
              </Badge>
            </div>
            <CardDescription>
              Ringkasan energi, pengguna, dan konektivitas perangkat dari Firebase.
            </CardDescription>
          </div>

          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
            <span className="relative flex h-2.5 w-2.5">
              {onlineDevices > 0 && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60" />
              )}
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${onlineDevices > 0 ? "bg-cyan-500" : "bg-muted-foreground"}`} />
            </span>
            <div>
              <p className="text-xs text-muted-foreground">System health</p>
              <p className="text-sm font-medium">{onlinePercent}% perangkat online</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          index={0}
          title="Total Energi Sistem"
          value={displayEnergy.toFixed(3)}
          unit={energyUnit === "kwh" ? "kWh" : "MJ"}
          helper="Akumulasi nilai realtime seluruh device"
          icon={Zap}
          tone="violet"
          extra={
            <select
              value={energyUnit}
              onChange={(event) => setEnergyUnit(event.target.value as EnergyUnit)}
              className="h-8 rounded-md border bg-background px-2 text-xs text-muted-foreground outline-none focus:ring-2 focus:ring-ring/40"
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
          tone="indigo"
        />
        <MetricCard
          index={2}
          title="Device Online"
          value={onlineDevices}
          helper="Update diterima dalam 15 detik"
          icon={Wifi}
          tone="cyan"
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

      <EmissionComparisonCard
        flowRateM3h={totalFlowRate}
        title="Dampak substitusi LPG seluruh sistem"
        description="Estimasi realtime berdasarkan total flowrate dari perangkat yang sedang online. Nilai menunjukkan LPG dengan energi setara dan potensi emisi CO₂ fosil dari LPG yang dapat dihindari."
        scopeLabel={`${onlineDevices} device online`}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,0.75fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-start justify-between gap-4 border-b bg-muted/20">
            <div>
              <CardTitle className="text-base">Trend energi terbaru</CardTitle>
              <CardDescription className="mt-1">20 data histori terakhir dari seluruh perangkat</CardDescription>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-background text-violet-600 dark:text-violet-300">
              <BatteryCharging className="h-4 w-4" />
            </div>
          </CardHeader>

          <CardContent className="h-[350px] px-2 pb-4 pt-5 sm:px-4">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada histori energi.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminEnergyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.30} />
                      <stop offset="88%" stopColor="var(--chart-4)" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>

                  <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    minTickGap={28}
                    tickMargin={10}
                    stroke="var(--muted-foreground)"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={11}
                    width={58}
                    tickMargin={8}
                    stroke="var(--muted-foreground)"
                    tickFormatter={(value) => Number(value).toFixed(2)}
                  />
                  <Tooltip
                    cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "var(--popover)",
                      color: "var(--popover-foreground)",
                      boxShadow: "0 10px 30px -12px rgba(0,0,0,.35)",
                    }}
                    formatter={(value) => [
                      `${Number(value).toFixed(3)} ${energyUnit === "kwh" ? "kWh" : "MJ"}`,
                      "Energi",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="energy"
                    stroke="var(--chart-4)"
                    fill="url(#adminEnergyGradient)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }}
                    isAnimationActive
                    animationDuration={900}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle className="text-base">Status perangkat</CardTitle>
            <CardDescription>Distribusi device online dan offline</CardDescription>
          </CardHeader>

          <CardContent className="flex min-h-[350px] flex-col items-center justify-center gap-4 p-5">
            <div className="relative h-[220px] w-full max-w-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={66}
                    outerRadius={90}
                    paddingAngle={4}
                    cornerRadius={8}
                    stroke="none"
                    isAnimationActive
                    animationDuration={800}
                  >
                    <Cell fill="var(--chart-2)" />
                    <Cell fill="var(--chart-5)" />
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid var(--border)",
                      background: "var(--popover)",
                      color: "var(--popover-foreground)",
                      boxShadow: "0 10px 30px -12px rgba(0,0,0,.35)",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-semibold tracking-tight tabular-nums">{totalDevices}</p>
                  <p className="text-xs text-muted-foreground">Total device</p>
                </div>
              </div>
            </div>

            <div className="grid w-full grid-cols-2 gap-2">
              <StatusLegend label="Online" value={onlineDevices} dotClassName="bg-cyan-500" />
              <StatusLegend label="Offline" value={offlineDevices} dotClassName="bg-rose-500" />
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
  tone: "violet" | "indigo" | "cyan" | "rose";
  extra?: ReactNode;
}) {
  const toneClasses = {
    violet: "text-violet-600 dark:text-violet-300",
    indigo: "text-indigo-600 dark:text-indigo-300",
    cyan: "text-cyan-600 dark:text-cyan-300",
    rose: "text-rose-600 dark:text-rose-300",
  }[tone];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04 }}
    >
      <Card className="h-full transition-colors hover:border-primary/20">
        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/30 ${toneClasses}`}>
            <Icon className="h-4 w-4" />
          </div>
          {extra}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{title}</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
            {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">{helper}</p>
        </CardContent>
      </Card>
    </motion.div>
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
    <div className="rounded-lg border bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className={`h-2 w-2 rounded-full ${dotClassName}`} />
        {label}
      </div>
      <p className="mt-1 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}