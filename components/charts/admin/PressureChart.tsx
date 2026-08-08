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

type PressureUnit = "kpa" | "bar";

const convertPressure = (v: number, u: PressureUnit) =>
  u === "bar" ? v / 100 : v;

type Props = {
  data: Array<{ index?: number; pressure?: number }>;
  unit: PressureUnit;
};

export default function PressureChart({ data, unit }: Props) {
  const chartData = data.map((d) => ({
    ...d,
    pressureConverted: convertPressure(d.pressure ?? 0, unit),
  }));

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="pressureGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="index" />
          <YAxis />
          <Tooltip />

          <Area
            type="monotone"
            dataKey="pressureConverted"
            stroke="#ea580c"
            strokeWidth={2.5}
            fill="url(#pressureGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
