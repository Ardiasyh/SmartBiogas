"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { AREA_CHART_MARGIN, paddedChartDomain } from "@/lib/chart-domain";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type PowerUnit = "kw" | "w";

const convertPower = (value: number, unit: PowerUnit) =>
  unit === "w" ? value * 1000 : value;

const unitLabel = (unit: PowerUnit) => (unit === "w" ? "W" : "kW");

const chartConfig = {
  powerConverted: {
    label: "Daya biogas",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

type Props = {
  data: Array<{ index?: number; powerKw?: number; timestamp?: number }>;
  unit: PowerUnit;
};

export default function EnergyChart({ data, unit }: Props) {
  const fullChartData = data.map((point) => ({
    ...point,
    powerConverted: convertPower(point.powerKw ?? 0, unit),
  }));
  const chartData = compactPowerData(fullChartData);
  const domain = paddedChartDomain(chartData.map((point) => point.powerConverted));

  if (fullChartData.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Belum ada data daya.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-[260px] min-h-[260px] w-full aspect-auto">
      <AreaChart accessibilityLayer data={chartData} margin={AREA_CHART_MARGIN}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="index"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={18}
        />
        <YAxis hide domain={domain} />
        <ChartTooltip
          cursor={{ stroke: "var(--border)", strokeDasharray: "3 4" }}
          content={
            <ChartTooltipContent
              indicator="line"
              labelFormatter={(label) => `Sampel ${label}`}
              valueFormatter={(value) => `${Number(value).toFixed(3)} ${unitLabel(unit)}`}
            />
          }
        />

        <Area
          type="monotone"
          dataKey="powerConverted"
          stroke="var(--color-powerConverted)"
          fill="var(--color-powerConverted)"
          fillOpacity={0.12}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 3, strokeWidth: 0 }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  );
}

function compactPowerData<T extends { timestamp?: number; powerConverted: number }>(
  points: T[],
  maxPoints = 120,
) {
  if (points.length <= maxPoints) return points;

  const bucketSize = Math.ceil(points.length / maxPoints);
  const compacted: T[] = [];
  for (let index = 0; index < points.length; index += bucketSize) {
    const bucket = points.slice(index, index + bucketSize);
    compacted.push({
      ...bucket[0],
      timestamp: Math.round(
        bucket.reduce((sum, point) => sum + (point.timestamp ?? 0), 0) / bucket.length,
      ),
      powerConverted:
        bucket.reduce((sum, point) => sum + point.powerConverted, 0) / bucket.length,
    });
  }
  return compacted;
}
