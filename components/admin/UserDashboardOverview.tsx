"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { motion } from "framer-motion";
import {
  Activity,
  BatteryCharging,
  Gauge,
  Users,
  Wifi,
  WifiOff,
  Wind,
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
  XAxis,
  YAxis,
} from "recharts";

import { db } from "@/lib/firebase";
import { AREA_CHART_MARGIN, paddedChartDomain } from "@/lib/chart-domain";
import { watchDeviceTelemetry } from "@/lib/device-telemetry";
import { watchHistoryFrom, type HistoryPoint } from "@/lib/device-history";
import { DEVICE_OFFLINE_TIMEOUT_MS, type Telemetry } from "@/lib/telemetry";
import {
  CHART_RANGE_LABELS,
  ChartRangeSelector,
  chartRangeStart,
  formatChartTick,
  type ChartRange,
} from "@/components/charts/user/ChartRangeSelector";
import EmissionComparisonCard from "@/components/impact/EmissionComparisonCard";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type PowerUnit = "kw" | "w";

type RawLog = {
  timestamp: number;
  powerKw: number;
  flowrate: number;
  pressure: number;
};

type SystemChartPoint = {
  time: string;
  powerKw: number;
  flowrate: number;
  pressure: number;
};

const powerChartConfig = {
  powerKw: {
    label: "Daya biogas",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

const flowChartConfig = {
  flowrate: {
    label: "Flowrate",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const pressureChartConfig = {
  pressure: {
    label: "Tekanan",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

const deviceChartConfig = {
  online: {
    label: "Online",
    color: "var(--chart-2)",
  },
  offline: {
    label: "Offline",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

function convertPower(value: number, unit: PowerUnit) {
  return unit === "w" ? value * 1000 : value;
}

export default function AdminDashboardOverview() {
  const [totalPowerKw, setTotalPowerKw] = useState(0);
  const [totalFlowRate, setTotalFlowRate] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [onlineDevices, setOnlineDevices] = useState(0);
  const [offlineDevices, setOfflineDevices] = useState(0);
  const [warningDevices, setWarningDevices] = useState(0);
  const [rawLogs, setRawLogs] = useState<RawLog[]>([]);
  const [powerUnit, setPowerUnit] = useState<PowerUnit>("kw");
  const [historyRange, setHistoryRange] = useState<ChartRange>("7d");

  const chartData = useMemo(
    () =>
      compactEnergyData(rawLogs).map((log) => ({
        time: formatChartTick(log.timestamp, historyRange),
        powerKw: convertPower(log.powerKw, powerUnit),
        flowrate: log.flowrate,
        pressure: log.pressure,
      })),
    [rawLogs, powerUnit, historyRange],
  );
  const powerDomain = paddedChartDomain(chartData.map((point) => point.powerKw));
  const flowDomain = paddedChartDomain(chartData.map((point) => point.flowrate));
  const pressureDomain = paddedChartDomain(chartData.map((point) => point.pressure));

  useEffect(() => {
    const historyFrom = chartRangeStart(historyRange);
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
        (value) => now - value.timestamp <= DEVICE_OFFLINE_TIMEOUT_MS,
      );
      const online = onlineValues.length;

      setTotalPowerKw(
        onlineValues.reduce((total, value) => total + Number(value.powerKw || 0), 0),
      );
      setWarningDevices(
        onlineValues.filter((value) => value.status?.toLowerCase() === "warning").length,
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
        .map(({ timestamp, powerKw, flowrate, pressure }) => ({
          timestamp,
          powerKw: Number(powerKw || 0),
          flowrate: Number(flowrate || 0),
          pressure: Number(pressure || 0),
        }))
        .sort((a, b) => a.timestamp - b.timestamp);

      setRawLogs(compactEnergyData(merged));
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
            watchHistoryFrom(
              deviceId,
              historyFrom,
              (history) => {
                histories.set(deviceId, history);
                refreshHistory();
              },
              (error) => {
                console.error(`[RTDB] Gagal membaca logs device ${deviceId}:`, error);
                histories.set(deviceId, []);
                refreshHistory();
              },
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
  }, [historyRange]);

  const displayPower = convertPower(totalPowerKw, powerUnit);
  const totalDevices = onlineDevices + offlineDevices;
  const onlinePercent = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;

  const pieData = [
    { status: "online", value: onlineDevices },
    { status: "offline", value: offlineDevices },
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
              Ringkasan daya biogas, kondisi sensor, dan konektivitas perangkat dari Firebase.
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
              {warningDevices > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-300">{warningDevices} perangkat memberi status warning</p>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          index={0}
          title="Total Daya Sistem"
          value={displayPower.toFixed(3)}
          unit={powerUnit === "kw" ? "kW" : "W"}
          helper="Jumlah daya sesaat dari perangkat online"
          icon={Zap}
          tone="violet"
          extra={
            <select
              value={powerUnit}
              onChange={(event) => setPowerUnit(event.target.value as PowerUnit)}
              className="h-8 rounded-md border bg-background px-2 text-xs text-muted-foreground outline-none focus:ring-2 focus:ring-ring/40"
            >
              <option value="kw">kW</option>
              <option value="w">W</option>
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
          helper="Update diterima dalam 30 detik"
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
          <CardHeader className="flex flex-col gap-4 border-b bg-muted/20 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">Trend daya terbaru</CardTitle>
              <CardDescription className="mt-1">
                {CHART_RANGE_LABELS[historyRange]} terakhir · {rawLogs.length} sampel seluruh perangkat
              </CardDescription>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
              <div className="flex h-9 w-9 items-center justify-center self-end rounded-lg border bg-background text-violet-600 dark:text-violet-300">
                <BatteryCharging className="h-4 w-4" />
              </div>
              <ChartRangeSelector value={historyRange} onChange={setHistoryRange} />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {chartData.length === 0 ? (
              <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">Belum ada histori daya.</div>
            ) : (
              <ChartContainer config={powerChartConfig} className="h-[350px] w-full aspect-auto px-2 pb-4 pt-5 sm:px-4">
                <AreaChart accessibilityLayer data={chartData} margin={AREA_CHART_MARGIN}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="time"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={28}
                    tickMargin={10}
                  />
                  <YAxis
                    hide
                    domain={powerDomain}
                  />
                  <ChartTooltip
                    cursor={{ stroke: "var(--border)", strokeDasharray: "3 4" }}
                    content={
                      <ChartTooltipContent
                        indicator="line"
                        valueFormatter={(value) => `${Number(value).toFixed(3)} ${powerUnit === "kw" ? "kW" : "W"}`}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="powerKw"
                    stroke="var(--color-powerKw)"
                    fill="var(--color-powerKw)"
                    fillOpacity={0.12}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ChartContainer>
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
              <ChartContainer config={deviceChartConfig} className="h-[220px] w-full aspect-auto">
                <PieChart accessibilityLayer>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="status"
                    innerRadius={66}
                    outerRadius={90}
                    paddingAngle={4}
                    cornerRadius={8}
                    stroke="none"
                    isAnimationActive
                    animationDuration={800}
                  >
                    <Cell fill="var(--color-online)" />
                    <Cell fill="var(--color-offline)" />
                  </Pie>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel nameKey="status" />}
                  />
                </PieChart>
              </ChartContainer>

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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SystemMetricChart
          title="Flowrate seluruh sistem"
          description="Rata-rata flowrate dari seluruh perangkat pada rentang terpilih."
          data={chartData}
          dataKey="flowrate"
          unit="m³/h"
          domain={flowDomain}
          config={flowChartConfig}
          icon={<Wind className="h-4 w-4" />}
        />
        <SystemMetricChart
          title="Tekanan seluruh sistem"
          description="Rata-rata tekanan dari seluruh perangkat pada rentang terpilih."
          data={chartData}
          dataKey="pressure"
          unit="kPa"
          domain={pressureDomain}
          config={pressureChartConfig}
          icon={<Gauge className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}

function compactEnergyData(points: RawLog[], maxPoints = 120) {
  if (points.length <= maxPoints) return points;

  const bucketSize = Math.ceil(points.length / maxPoints);
  const compacted: RawLog[] = [];
  for (let index = 0; index < points.length; index += bucketSize) {
    const bucket = points.slice(index, index + bucketSize);
    compacted.push({
      timestamp: Math.round(bucket.reduce((sum, point) => sum + point.timestamp, 0) / bucket.length),
      powerKw: bucket.reduce((sum, point) => sum + point.powerKw, 0) / bucket.length,
      flowrate: bucket.reduce((sum, point) => sum + point.flowrate, 0) / bucket.length,
      pressure: bucket.reduce((sum, point) => sum + point.pressure, 0) / bucket.length,
    });
  }
  return compacted;
}

function SystemMetricChart({
  title,
  description,
  data,
  dataKey,
  unit,
  domain,
  config,
  icon,
}: {
  title: string;
  description: string;
  data: SystemChartPoint[];
  dataKey: "flowrate" | "pressure";
  unit: string;
  domain: [number, number];
  config: ChartConfig;
  icon: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4 border-b bg-muted/20">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription className="mt-1">{description}</CardDescription>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background text-sky-600 dark:text-sky-300">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="flex h-[290px] items-center justify-center text-sm text-muted-foreground">
            Belum ada histori perangkat.
          </div>
        ) : (
          <ChartContainer config={config} className="h-[290px] min-h-[290px] w-full aspect-auto px-2 pb-3 pt-4 sm:px-4">
            <AreaChart accessibilityLayer data={data} margin={AREA_CHART_MARGIN}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="time"
                tickLine={false}
                axisLine={false}
                minTickGap={28}
                tickMargin={8}
              />
              <YAxis hide domain={domain} />
              <ChartTooltip
                cursor={{ stroke: "var(--border)", strokeDasharray: "3 4" }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    valueFormatter={(value) => `${Number(value).toFixed(3)} ${unit}`}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey={dataKey}
                stroke={`var(--color-${dataKey})`}
                fill={`var(--color-${dataKey})`}
                fillOpacity={0.12}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
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
