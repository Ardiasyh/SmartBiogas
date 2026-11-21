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

type PressureUnit = "kpa" | "bar";

const convertPressure = (value: number, unit: PressureUnit) =>
  unit === "bar" ? value / 100 : value;

const unitLabel = (unit: PressureUnit) => (unit === "bar" ? "bar" : "kPa");

const chartConfig = {
  pressureConverted: {
    label: "Tekanan",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

type Props = {
  data: Array<{ index?: number; pressure?: number; timestamp?: number }>;
  unit: PressureUnit;
};

export default function PressureChart({ data, unit }: Props) {
  const fullChartData = data.map((point) => ({
    ...point,
    pressureConverted: convertPressure(point.pressure ?? 0, unit),
  }));
  const chartData = compactPressureData(fullChartData);
  const domain = paddedChartDomain(chartData.map((point) => point.pressureConverted));

  if (fullChartData.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Belum ada data tekanan.
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
          dataKey="pressureConverted"
          stroke="var(--color-pressureConverted)"
          fill="var(--color-pressureConverted)"
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

function compactPressureData<T extends { timestamp?: number; pressureConverted: number }>(
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
      pressureConverted:
        bucket.reduce((sum, point) => sum + point.pressureConverted, 0) / bucket.length,
    });
  }
  return compacted;
}
