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
  const chartData = data.map((point) => ({
    ...point,
    pressureConverted: convertPressure(point.pressure ?? 0, unit),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Belum ada data tekanan.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-72 w-full aspect-auto">
      <AreaChart accessibilityLayer data={chartData} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}>
        <defs>
          <linearGradient id="adminPressureFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-pressureConverted)" stopOpacity={0.28} />
            <stop offset="95%" stopColor="var(--color-pressureConverted)" stopOpacity={0.02} />
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
          dataKey="pressureConverted"
          stroke="var(--color-pressureConverted)"
          strokeWidth={2.25}
          fill="url(#adminPressureFill)"
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
