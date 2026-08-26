"use client";

import { useEffect, useMemo, useState } from "react";
import { ref, query, orderByChild, limitToLast, onValue } from "firebase/database";
import { Activity, Gauge } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { rtdb } from "@/lib/firebase";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface PressureData {
  timestamp: number;
  pressure: number;
}

interface Props {
  deviceId: string;
}

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export default function ChartPressureUser({ deviceId }: Props) {
  const [data, setData] = useState<PressureData[]>([]);
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
        const points: PressureData[] = [];

        snapshot.forEach((child) => {
          const value = child.val();
          const timestamp = Number(value?.timestamp ?? 0);
          if (!timestamp) return;

          points.push({
            timestamp,
            pressure: Number(value?.pressure ?? 0),
          });
        });

        points.sort((a, b) => a.timestamp - b.timestamp);
        setData(points);
        setLoading(false);
      },
      (error) => {
        console.error(`[RTDB] Gagal membaca pressure device ${deviceId}:`, error);
        setData([]);
        setLoading(false);
      },
    );
  }, [deviceId]);

  const stats = useMemo(() => {
    const latest = data.at(-1)?.pressure ?? 0;
    const average = data.length ? data.reduce((sum, point) => sum + point.pressure, 0) / data.length : 0;
    const min = data.length ? Math.min(...data.map((point) => point.pressure)) : 0;
    const max = data.length ? Math.max(...data.map((point) => point.pressure)) : 0;
    return { latest, average, min, max };
  }, [data]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background text-amber-600 dark:text-amber-300">
              <Gauge className="h-4 w-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">Tekanan gas</CardTitle>
                <Badge variant="secondary" className="gap-1 font-normal">
                  <Activity className="h-3 w-3" /> Live history
                </Badge>
              </div>
              <CardDescription className="mt-1">20 sampel terakhir dalam kPa</CardDescription>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-muted-foreground">Nilai terbaru</p>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {stats.latest.toFixed(3)} <span className="text-sm font-normal text-muted-foreground">kPa</span>
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-3 border-b bg-background/40">
          <Stat label="Rata-rata" value={stats.average.toFixed(3)} />
          <Stat label="Minimum" value={stats.min.toFixed(3)} />
          <Stat label="Maksimum" value={stats.max.toFixed(3)} />
        </div>

        <div className="h-[300px] px-2 pb-4 pt-5 sm:px-4">
          {loading ? (
            <ChartLoading />
          ) : data.length === 0 ? (
            <ChartEmpty />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                <defs>
                  <linearGradient id="pressureAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.28} />
                    <stop offset="85%" stopColor="var(--chart-3)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatTime}
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
                  formatter={(value) => [`${Number(value).toFixed(3)} kPa`, "Pressure"]}
                  labelFormatter={(value) => new Date(Number(value)).toLocaleString("id-ID")}
                />
                <Area
                  type="monotone"
                  dataKey="pressure"
                  stroke="var(--chart-3)"
                  fill="url(#pressureAreaGradient)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }}
                  isAnimationActive
                  animationDuration={850}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
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
      {[48, 55, 45, 70, 63, 76, 67, 72, 58, 64].map((height, index) => (
        <div key={index} className="flex-1 animate-pulse rounded-sm bg-muted" style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

function ChartEmpty() {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data tekanan.</div>;
}
