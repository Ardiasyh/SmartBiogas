"use client";

import { useEffect, useMemo, useState } from "react";
import { ref, query, orderByChild, limitToLast, onValue } from "firebase/database";
import { Activity, Zap } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { rtdb } from "@/lib/firebase";
import { calculateEnergyKwh } from "@/lib/biogas";
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

interface EnergyData {
  timestamp: number;
  energy: number;
}

interface Props {
  deviceId: string;
}

const chartConfig = {
  energy: {
    label: "Energi",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export default function ChartEnergyUser({ deviceId }: Props) {
  const [data, setData] = useState<EnergyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const logsQuery = query(
      ref(rtdb, `biogasData/${deviceId}/logs`),
      orderByChild("timestamp"),
      limitToLast(20),
    );

    return onValue(
      logsQuery,
      (snapshot) => {
        const points: EnergyData[] = [];

        snapshot.forEach((child) => {
          const value = child.val();
          const timestamp = Number(value?.timestamp ?? 0);
          const flow = Number(value?.flowrate ?? 0);
          const storedEnergy = Number(value?.energy ?? 0);

          if (!timestamp) return;

          points.push({
            timestamp,
            energy:
              Number.isFinite(storedEnergy) && storedEnergy !== 0
                ? storedEnergy
                : calculateEnergyKwh(flow),
          });
        });

        points.sort((a, b) => a.timestamp - b.timestamp);
        setData(points);
        setLoading(false);
      },
      (error) => {
        console.error(`[RTDB] Gagal membaca log energi device ${deviceId}:`, error);
        setData([]);
        setLoading(false);
      },
    );
  }, [deviceId]);

  const stats = useMemo(() => {
    const latest = data.at(-1)?.energy ?? 0;
    const total = data.reduce((sum, point) => sum + point.energy, 0);
    const average = data.length ? total / data.length : 0;
    const peak = data.length ? Math.max(...data.map((point) => point.energy)) : 0;
    return { latest, total, average, peak };
  }, [data]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background text-violet-600 dark:text-violet-300">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">Energi biogas</CardTitle>
                <Badge variant="secondary" className="gap-1 font-normal">
                  <Activity className="h-3 w-3" /> Live history
                </Badge>
              </div>
              <CardDescription className="mt-1">20 sampel histori energi terbaru</CardDescription>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-muted-foreground">Nilai terbaru</p>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {stats.latest.toFixed(3)} <span className="text-sm font-normal text-muted-foreground">kWh</span>
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-3 border-b bg-muted/10">
          <Stat label="Rata-rata" value={`${stats.average.toFixed(3)} kWh`} />
          <Stat label="Puncak" value={`${stats.peak.toFixed(3)} kWh`} />
          <Stat label="Total sampel" value={`${stats.total.toFixed(3)} kWh`} />
        </div>

        {loading ? (
          <div className="h-[330px] p-4">
            <ChartLoading />
          </div>
        ) : data.length === 0 ? (
          <div className="h-[330px]">
            <ChartEmpty />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[330px] w-full aspect-auto px-2 pb-4 pt-5 sm:px-4">
            <AreaChart accessibilityLayer data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="userEnergyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-energy)" stopOpacity={0.30} />
                  <stop offset="95%" stopColor="var(--color-energy)" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid vertical={false} strokeDasharray="3 5" />
              <XAxis
                dataKey="timestamp"
                tickFormatter={formatTime}
                tickLine={false}
                axisLine={false}
                minTickGap={28}
                tickMargin={10}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={58}
                tickMargin={8}
                tickFormatter={(value) => Number(value).toFixed(2)}
              />
              <ChartTooltip
                cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(label) => new Date(Number(label)).toLocaleString("id-ID")}
                    valueFormatter={(value) => `${Number(value).toFixed(3)} kWh`}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="energy"
                stroke="var(--color-energy)"
                fill="url(#userEnergyFill)"
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }}
                isAnimationActive
                animationDuration={900}
                animationEasing="ease-out"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 text-center sm:text-left">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium tabular-nums">{value}</p>
    </div>
  );
}

function ChartLoading() {
  return (
    <div className="flex h-full items-end gap-2 px-3 pb-8">
      {[30, 48, 40, 65, 52, 78, 60, 82, 68, 88].map((height, index) => (
        <div key={index} className="flex-1 animate-pulse rounded-sm bg-muted" style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

function ChartEmpty() {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data energi.</div>;
}
