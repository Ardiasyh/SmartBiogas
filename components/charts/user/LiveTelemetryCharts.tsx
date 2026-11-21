"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Activity, Gauge, Thermometer, Wind, Zap } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import { watchDeviceTelemetry } from "@/lib/device-telemetry";
import { watchRecentHistory, type HistoryPoint } from "@/lib/device-history";
import type { Telemetry } from "@/lib/telemetry";
import { AREA_CHART_MARGIN, paddedChartDomain } from "@/lib/chart-domain";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const MAX_POINTS = 10;

type Sample = {
  timestamp: number;
  flowrate: number;
  pressure: number;
  powerKw: number;
  temperature: number;
  massKgph?: number;
};

type MetricKey = "flowrate" | "pressure" | "powerKw" | "temperature" | "massKgph";

const configs = {
  flowrate: { flowrate: { label: "Flowrate", color: "var(--chart-2)" } },
  pressure: { pressure: { label: "Tekanan", color: "var(--chart-3)" } },
  powerKw: { powerKw: { label: "Daya biogas", color: "var(--chart-4)" } },
  temperature: { temperature: { label: "Suhu", color: "var(--chart-5)" } },
  massKgph: { massKgph: { label: "Laju massa", color: "var(--chart-1)" } },
} satisfies Record<MetricKey, ChartConfig>;

export default function LiveTelemetryCharts({ deviceId }: { deviceId: string }) {
  const [sampleState, setSampleState] = useState<{ deviceId: string; samples: Sample[] } | null>(null);
  const samples = sampleState?.deviceId === deviceId ? sampleState.samples : [];

  useEffect(() => {
    if (!deviceId) return;

    const stopHistory = watchRecentHistory(
      deviceId,
      (history) => setSampleState((current) => ({
        deviceId,
        samples: mergeSamples(current?.deviceId === deviceId ? current.samples : [], history.map(toSample)),
      })),
      (error) => console.error(`[RTDB] Gagal membaca sampel terbaru device ${deviceId}:`, error),
      MAX_POINTS,
    );
    const stopRealtime = watchDeviceTelemetry(deviceId, (value) => {
      if (value) {
        setSampleState((current) => ({
          deviceId,
          samples: mergeSamples(current?.deviceId === deviceId ? current.samples : [], [toSample(value)]),
        }));
      }
    });

    return () => {
      stopHistory();
      stopRealtime();
    };
  }, [deviceId]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <CardTitle className="text-base">Grafik sensor live</CardTitle>
              <Badge variant="secondary" className="gap-1 font-normal">
                <Activity className="h-3 w-3" /> Realtime
              </Badge>
            </div>
            <CardDescription>Flowrate, tekanan, suhu, daya, dan laju massa · 10 data terakhir</CardDescription>
          </div>
          <p className="text-xs text-muted-foreground">{samples.length} / {MAX_POINTS} titik</p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 p-4 sm:grid-cols-2 2xl:grid-cols-5">
        <MetricChart title="Flowrate" data={samples} dataKey="flowrate" unit="m³/h" icon={<Wind className="h-4 w-4" />} />
        <MetricChart title="Daya biogas" data={samples} dataKey="powerKw" unit="kW" icon={<Zap className="h-4 w-4" />} />
        <MetricChart title="Suhu" data={samples} dataKey="temperature" unit="°C" icon={<Thermometer className="h-4 w-4" />} />
        <MetricChart title="Tekanan" data={samples} dataKey="pressure" unit="kPa" icon={<Gauge className="h-4 w-4" />} />
        <MetricChart title="Laju massa" data={samples} dataKey="massKgph" unit="kg/h" icon={<Wind className="h-4 w-4" />} />
      </CardContent>
    </Card>
  );
}

function MetricChart({
  title,
  data,
  dataKey,
  unit,
  icon,
}: {
  title: string;
  data: Sample[];
  dataKey: MetricKey;
  unit: string;
  icon: ReactNode;
}) {
  const config = configs[dataKey];
  const latestValue = data.at(-1)?.[dataKey];
  const domain = paddedChartDomain(data.map((point) => point[dataKey] ?? 0));

  return (
    <div className="min-w-0 rounded-lg border bg-background p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">{icon}{title}</div>
        <span className="text-sm tabular-nums text-muted-foreground">
          {latestValue === undefined ? "—" : latestValue.toFixed(3)} {unit}
        </span>
      </div>
      {data.length === 0 ? (
        <div className="flex h-[190px] items-center justify-center text-center text-xs text-muted-foreground">
          Menunggu data realtime dari perangkat…
        </div>
      ) : (
        <ChartContainer config={config} className="h-[190px] w-full aspect-auto">
          <AreaChart accessibilityLayer data={data} margin={AREA_CHART_MARGIN}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => new Date(Number(value)).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              tickLine={false}
              axisLine={false}
              minTickGap={32}
            />
            <YAxis hide domain={domain} />
            <ChartTooltip
              cursor={{ stroke: "var(--border)", strokeDasharray: "3 4" }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(label) => new Date(Number(label)).toLocaleString("id-ID")}
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
              isAnimationActive
              animationDuration={180}
              dot={data.length === 1 ? { r: 3 } : false}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}

function toSample(point: Telemetry | HistoryPoint): Sample {
  return {
    timestamp: point.timestamp,
    flowrate: point.flowrate,
    pressure: point.pressure,
    powerKw: point.powerKw,
    temperature: point.temperature,
    massKgph: point.massKgph,
  };
}

function mergeSamples(current: Sample[], incoming: Sample[]) {
  const byTimestamp = new Map(current.map((sample) => [sample.timestamp, sample]));
  incoming.forEach((sample) => byTimestamp.set(sample.timestamp, sample));
  return [...byTimestamp.values()]
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(-MAX_POINTS);
}
