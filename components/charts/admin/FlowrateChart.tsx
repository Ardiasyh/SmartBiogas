"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type FlowUnit = "m3h" | "lmin";

const convertFlow = (v: number, u: FlowUnit) =>
  u === "lmin" ? (v * 1000) / 60 : v;

type Props = {
  data: Array<{ index?: number; flowrate?: number }>;
  unit: FlowUnit;
};

export default function FlowrateChart({ data, unit }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    flowConverted: convertFlow(d.flowrate ?? 0, unit),
  }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="index" />
          <YAxis />
          <Tooltip />

          <Area
            type="monotone"
            dataKey="flowConverted"
            stroke="#2563eb"
            strokeWidth={2.5}
            fill="url(#flowGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
