"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type FlowUnit = "m3h" | "lmin";

const convertFlow = (value: number, unit: FlowUnit) =>
  unit === "lmin" ? (value * 1000) / 60 : value;

const unitLabel = (unit: FlowUnit) => (unit === "lmin" ? "L/min" : "m³/h");

type Props = {
  data: Array<{ index?: number; flowrate?: number; timestamp?: number }>;
  unit: FlowUnit;
};

export default function FlowrateChart({ data, unit }: Props) {
  const chartData = data.map((point) => ({
    ...point,
    flowConverted: convertFlow(point.flowrate ?? 0, unit),
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}>
          <defs>
            <linearGradient id="adminFlowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.28} />
              <stop offset="88%" stopColor="var(--chart-2)" stopOpacity={0.02} />
            </linearGradient>
          </defs>

          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
          <XAxis
            dataKey="index"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            fontSize={11}
            stroke="var(--muted-foreground)"
            minTickGap={18}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            width={58}
            fontSize={11}
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
            formatter={(value) => [`${Number(value).toFixed(3)} ${unitLabel(unit)}`, "Flowrate"]}
            labelFormatter={(value) => `Sampel ${value}`}
          />

          <Area
            type="monotone"
            dataKey="flowConverted"
            stroke="var(--chart-2)"
            strokeWidth={2.5}
            fill="url(#adminFlowGradient)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, fill: "var(--background)" }}
            isAnimationActive
            animationDuration={850}
            animationEasing="ease-out"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
