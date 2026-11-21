"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Zap } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { AREA_CHART_MARGIN, paddedChartDomain } from "@/lib/chart-domain";
import { watchHistoryFrom } from "@/lib/device-history";
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
import {
  CHART_RANGE_LABELS,
  ChartRangeSelector,
  chartRangeStart,
  formatChartTick,
  type ChartRange,
} from "@/components/charts/user/ChartRangeSelector";

interface EnergyData {
  timestamp: number;
  powerKw: number;
}

interface Props {
  deviceId: string;
  range?: ChartRange;
}

type EnergySnapshot = {
  deviceId: string;
  range: ChartRange;
  points: EnergyData[];
};

const EMPTY_ENERGY_DATA: EnergyData[] = [];

const chartConfig = {
  powerKw: {
    label: "Daya biogas",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

export default function ChartEnergyUser({ deviceId, range: controlledRange }: Props) {
  const [localRange, setLocalRange] = useState<ChartRange>("7d");
  const range = controlledRange ?? localRange;
  const [snapshotData, setSnapshotData] = useState<EnergySnapshot | null>(null);
  const snapshotMatches = snapshotData?.deviceId === deviceId && snapshotData.range === range;
  const data = snapshotMatches ? snapshotData.points : EMPTY_ENERGY_DATA;
  const loading = Boolean(deviceId) && !snapshotMatches;
  const domain = paddedChartDomain(data.map((point) => point.powerKw));

  useEffect(() => {
    if (!deviceId) return;

    return watchHistoryFrom(
      deviceId,
      chartRangeStart(range),
      (history) => {
        const points = compactEnergyData(history.map((value) => ({
          timestamp: value.timestamp,
          powerKw: value.powerKw,
        })));
        setSnapshotData({ deviceId, range, points });
      },
      (error) => {
        console.error(`[RTDB] Gagal membaca log daya device ${deviceId}:`, error);
        setSnapshotData({ deviceId, range, points: [] });
      },
    );
  }, [deviceId, range]);

  const stats = useMemo(() => {
    const latest = data.at(-1)?.powerKw ?? 0;
    const average = data.length ? data.reduce((sum, point) => sum + point.powerKw, 0) / data.length : 0;
    const peak = data.length ? Math.max(...data.map((point) => point.powerKw)) : 0;
    return { latest, average, peak };
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
              <CardTitle className="text-base">Daya biogas</CardTitle>
                <Badge variant="secondary" className="gap-1 font-normal">
                  <Activity className="h-3 w-3" /> Live history
                </Badge>
              </div>
              <CardDescription className="mt-1">
                {CHART_RANGE_LABELS[range]} terakhir · {data.length} titik ringkas
              </CardDescription>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <p className="text-xs text-muted-foreground">Nilai terbaru</p>
            <p className="text-2xl font-semibold tracking-tight tabular-nums">
              {stats.latest.toFixed(3)} <span className="text-sm font-normal text-muted-foreground">kW</span>
            </p>
          </div>
        </div>

        {controlledRange === undefined && (
          <div className="flex flex-col gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">Rentang data</span>
            <ChartRangeSelector value={range} onChange={setLocalRange} />
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <div className="grid grid-cols-3 border-b bg-muted/10">
          <Stat label="Rata-rata daya" value={`${stats.average.toFixed(3)} kW`} />
          <Stat label="Puncak daya" value={`${stats.peak.toFixed(3)} kW`} />
          <Stat label="Jumlah sampel" value={data.length.toLocaleString("id-ID")} />
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
          <ChartContainer config={chartConfig} className="h-[300px] min-h-[300px] w-full aspect-auto px-1 pb-2 pt-3 sm:px-3">
            <AreaChart accessibilityLayer data={data} margin={AREA_CHART_MARGIN}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => formatChartTick(Number(value), range)}
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
                    labelFormatter={(label) => new Date(Number(label)).toLocaleString("id-ID")}
                    valueFormatter={(value) => `${Number(value).toFixed(3)} kW`}
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

function compactEnergyData(points: EnergyData[], maxPoints = 120) {
  if (points.length <= maxPoints) return points;

  const bucketSize = Math.ceil(points.length / maxPoints);
  const compacted: EnergyData[] = [];
  for (let index = 0; index < points.length; index += bucketSize) {
    const bucket = points.slice(index, index + bucketSize);
    compacted.push({
      timestamp: Math.round(bucket.reduce((sum, point) => sum + point.timestamp, 0) / bucket.length),
      powerKw: bucket.reduce((sum, point) => sum + point.powerKw, 0) / bucket.length,
    });
  }
  return compacted;
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
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data daya.</div>;
}
