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

type FlowUnit = "m3h" | "lmin";

const convertFlow = (value: number, unit: FlowUnit) =>
  unit === "lmin" ? (value * 1000) / 60 : value;

const unitLabel = (unit: FlowUnit) => (unit === "lmin" ? "L/min" : "m³/h");

const chartConfig = {
  flowConverted: {
    label: "Flowrate",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

type Props = {
  data: Array<{ index?: number; flowrate?: number; timestamp?: number }>;
  unit: FlowUnit;
};

export default function FlowrateChart({ data, unit }: Props) {
  const fullChartData = data.map((point) => ({
    ...point,
    flowConverted: convertFlow(point.flowrate ?? 0, unit),
  }));
  const chartData = compactFlowData(fullChartData);
  const domain = paddedChartDomain(chartData.map((point) => point.flowConverted));

  if (fullChartData.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Belum ada data flowrate.
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
          dataKey="flowConverted"
          stroke="var(--color-flowConverted)"
          fill="var(--color-flowConverted)"
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

function compactFlowData<T extends { timestamp?: number; flowConverted: number }>(
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
      flowConverted:
        bucket.reduce((sum, point) => sum + point.flowConverted, 0) / bucket.length,
    });
  }
  return compacted;
}
