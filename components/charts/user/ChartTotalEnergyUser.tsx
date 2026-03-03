"use client";

import { useEffect, useState, useMemo } from "react";
import { rtdb } from "@/lib/firebase";
import {
  ref,
  query,
  orderByChild,
  limitToLast,
  onValue,
  off,
} from "firebase/database";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
} from "recharts";

import { calculateEnergyKwh } from "@/lib/biogas";

interface EnergyData {
  timestamp: number;
  energy: number;
}

interface Props {
  deviceId: string;
}

export default function ChartEnergyUser({ deviceId }: Props) {
  const [data, setData] = useState<EnergyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!deviceId) return;

    const logsRef = query(
      ref(rtdb, `biogasData/${deviceId}/logs`),
      orderByChild("timestamp"),
      limitToLast(20)
    );

    onValue(logsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setData([]);
        setLoading(false);
        return;
      }

      const tempData: EnergyData[] = [];

      snapshot.forEach((child) => {
        const val = child.val();

        const timestamp = Number(val.timestamp ?? 0);
        const flow = Number(val.flowrate ?? 0);

        tempData.push({
          timestamp,
          energy: calculateEnergyKwh(flow),
        });
      });

      tempData.sort((a, b) => a.timestamp - b.timestamp);

      setData(tempData);
      setLoading(false);
    });

    return () => off(logsRef);
  }, [deviceId]);

  const totalEnergy = useMemo(() => {
    return data.reduce((acc, curr) => acc + curr.energy, 0);
  }, [data]);

  return (
    <div className="w-full h-[420px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">
          Total Energi Biogas (Realtime)
        </h2>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            Total 20 data terakhir
          </p>
          <p className="text-xl font-bold text-green-600">
            {totalEnergy.toFixed(3)} kWh
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Energi dihitung dari konversi flowrate menjadi kWh
      </p>

      {/* BODY */}
      {loading ? (
        <div className="flex items-center justify-center h-[70%] text-sm text-muted-foreground">
          Memuat data...
        </div>
      ) : data.length === 0 ? (
        <div className="flex items-center justify-center h-[70%] text-sm text-muted-foreground">
          Belum ada data tersedia
        </div>
      ) : (
        <ResponsiveContainer width="100%" height="70%">
        <LineChart data={data}>
          <defs>
            {/* Main Gradient */}
            <linearGradient id="energyGradientModern" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity={0.6} />
              <stop offset="60%" stopColor="#22c55e" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>

            {/* Glow Effect */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <CartesianGrid
            strokeDasharray="4 4"
            strokeOpacity={0.08}
            vertical={false}
          />

          <XAxis
            dataKey="timestamp"
            tickFormatter={(value) =>
              new Date(value).toLocaleTimeString()
            }
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />

          <YAxis
            fontSize={12}
            tickFormatter={(v) => v.toFixed(1)}
            tickLine={false}
            axisLine={false}
          />

          <Tooltip
            contentStyle={{
              borderRadius: "14px",
              border: "1px solid #e5e7eb",
              backdropFilter: "blur(6px)",
            }}
            labelFormatter={(value) =>
              new Date(value as number).toLocaleString()
            }
            formatter={(value: number) =>
              `${value.toFixed(3)} kWh`
            }
          />

          {/* Area Fill */}
          <Area
            type="monotone"
            dataKey="energy"
            stroke="none"
            fill="url(#energyGradientModern)"
            isAnimationActive
          />

          {/* Glow Line */}
          <Line
            type="monotone"
            dataKey="energy"
            stroke="#22c55e"
            strokeWidth={3}
            dot={false}
            activeDot={{
              r: 7,
              strokeWidth: 2,
              stroke: "#22c55e",
              fill: "#ffffff",
            }}
            filter="url(#glow)"
            isAnimationActive
          />
        </LineChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}