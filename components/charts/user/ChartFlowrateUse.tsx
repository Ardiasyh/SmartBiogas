"use client";

import { useEffect, useMemo, useState } from "react";
import { ref, query, orderByChild, limitToLast, onValue } from "firebase/database";
import { Activity, Wind } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

interface FlowData {
  timestamp: number;
  flow: number;
}

interface Props {
  deviceId: string;
}

const chartConfig = {
  flow: {
    label: "Flowrate",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const formatTime = (value: number) =>
  new Date(value).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

export default function ChartFlowrateUser({ deviceId }: Props) {
  const [data, setData] = useState<FlowData[]>([]);
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
        const points: FlowData[] = [];

        snapshot.forEach((child) => {
          const value = child.val();
          const timestamp = Number(value?.timestamp ?? 0);
          if (!timestamp) return;

          points.push({
            timestamp,
            flow: Number(value?.flowrate ?? 0),
          });
        });

        points.sort((a, b) => a.timestamp - b.timestamp);
        setData(points);
        setLoading(false);
      },
      (error) => {
        console.error(`[RTDB] Gagal membaca flowrate device ${deviceId}:`, error);
        setData([]);
        setLoading(false);
      },
    );
  }, [deviceId]);

  const stats = useMemo(() => {
    const latest = data.at(-1)?.flow ?? 0;
    const average = data.length ? data.reduce((sum, point) => sum + point.flow, 0) / data.length : 0;
    const min = data.length ? Math.min(...data.map((point) => point.flow)) : 0;
    const max = data.length ? Math.max(...data.map((point) => point.flow)) : 0;
    return { latest, average, min, max };
  }, [data]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20 pb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background text-sky-600 dark:text-sky-300">
              <Wind className="h-4 w-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle className="text-base">Flowrate biogas</CardTitle>
                <Badge variant="secondary" className="gap-1 font-normal">
                  <Activity className="h-3 w-3" /> Live history
                </Badge>
              </div>
              <CardDescription className="mt-1">20 sampel terakhir dalam m³/h</CardDescription>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-muted-foreground">Nilai terbaru</p>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {stats.latest.toFixed(3)} <span className="text-sm font-normal text-muted-foreground">m³/h</span>
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-3 border-b bg-muted/10">
          <Stat label="Rata-rata" value={stats.average.toFixed(3)} />
          <Stat label="Minimum" value={stats.min.toFixed(3)} />
          <Stat label="Maksimum" value={stats.max.toFixed(3)} />
        </div>

        {loading ? (
          <div className="h-[300px] p-4">
            <ChartLoading />
          </div>
        ) : data.length === 0 ? (
          <div className="h-[300px]">
            <ChartEmpty />
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full aspect-auto px-2 pb-4 pt-5 sm:px-4">
            <AreaChart accessibilityLayer data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="userFlowFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-flow)" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="var(--color-flow)" stopOpacity={0.02} />
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
                    valueFormatter={(value) => `${Number(value).toFixed(3)} m³/h`}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="flow"
                stroke="var(--color-flow)"
                fill="url(#userFlowFill)"
                strokeWidth={2.25}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }}
                isAnimationActive
                animationDuration={850}
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
      {[35, 55, 42, 76, 62, 85, 58, 72, 48, 67].map((height, index) => (
        <div key={index} className="flex-1 animate-pulse rounded-sm bg-muted" style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

function ChartEmpty() {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data flowrate.</div>;
}
