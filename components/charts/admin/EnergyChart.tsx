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

type EnergyUnit = "kwh" | "mj";

const convertEnergy = (value: number, unit: EnergyUnit) =>
  unit === "mj" ? value * 3.6 : value;

const unitLabel = (unit: EnergyUnit) => (unit === "mj" ? "MJ" : "kWh");

const chartConfig = {
  energyConverted: {
    label: "Energi",
    color: "var(--chart-4)",
  },
} satisfies ChartConfig;

type Props = {
  data: Array<{ index?: number; energy?: number; timestamp?: number }>;
  unit: EnergyUnit;
};

export default function EnergyChart({ data, unit }: Props) {
  const chartData = data.map((point) => ({
    ...point,
    energyConverted: convertEnergy(point.energy ?? 0, unit),
  }));

  if (chartData.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Belum ada data energi.
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-72 w-full aspect-auto">
      <AreaChart accessibilityLayer data={chartData} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}>
        <defs>
          <linearGradient id="adminEnergyDetailFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-energyConverted)" stopOpacity={0.30} />
            <stop offset="95%" stopColor="var(--color-energyConverted)" stopOpacity={0.02} />
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
          dataKey="energyConverted"
          stroke="var(--color-energyConverted)"
          strokeWidth={2.25}
          fill="url(#adminEnergyDetailFill)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }}
          isAnimationActive
          animationDuration={900}
          animationEasing="ease-out"
        />
      </AreaChart>
    </ChartContainer>
  );
}
