"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

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
  const chartData = data.map((point) => ({
    ...point,
    flowConverted: convertFlow(point.flowrate ?? 0, unit),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Belum ada data flowrate.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-72 w-full aspect-auto">
      <AreaChart accessibilityLayer data={chartData} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}>
        <defs>
          <linearGradient id="adminFlowFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-flowConverted)" stopOpacity={0.28} />
            <stop offset="95%" stopColor="var(--color-flowConverted)" stopOpacity={0.02} />
          </linearGradient>
        </defs>

        <CartesianGrid vertical={false} strokeDasharray="3 5" />
        <XAxis
          dataKey="index"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={18}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={58}
          tickFormatter={(value) => Number(value).toFixed(2)}
        />
        <ChartTooltip
          cursor={{ stroke: "var(--border)", strokeDasharray: "4 4" }}
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
          strokeWidth={2.25}
          fill="url(#adminFlowFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }}
          isAnimationActive
          animationDuration={850}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ChartContainer>
  );
}
