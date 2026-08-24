"use client";

import { useEffect, useMemo, useState } from "react";
import { rtdb } from "@/lib/firebase";
import {
  ref,
  query,
  orderByChild,
  limitToLast,
  onValue,
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
    if (!deviceId) {
      setData([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const logsQuery = query(
      ref(rtdb, `biogasData/${deviceId}/logs`),
      orderByChild("timestamp"),
      limitToLast(20),
    );

    return onValue(
      logsQuery,
      (snapshot) => {
        if (!snapshot.exists()) {
          setData([]);
          setLoading(false);
          return;
        }

        const tempData: EnergyData[] = [];

        snapshot.forEach((child) => {
          const val = child.val();
          const timestamp = Number(val?.timestamp ?? 0);
          const flow = Number(val?.flowrate ?? 0);
          const storedEnergy = Number(val?.energy ?? 0);

          if (!timestamp) return;

          tempData.push({
            timestamp,
            energy:
              Number.isFinite(storedEnergy) && storedEnergy !== 0
                ? storedEnergy
                : calculateEnergyKwh(flow),
          });
        });

        tempData.sort((a, b) => a.timestamp - b.timestamp);
        setData(tempData);
        setLoading(false);
      },
      (error) => {
        console.error(`[RTDB] Gagal membaca log energi device ${deviceId}:`, error);
        setData([]);
        setLoading(false);
      },
    );
  }, [deviceId]);

  const totalEnergy = useMemo(
    () => data.reduce((acc, curr) => acc + curr.energy, 0),
    [data],
  );

  return (
    <div className="w-full h-[420px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">
          Total Energi Biogas (20 data terbaru)
        </h2>

        <div className="text-right">
          <p className="text-xs text-muted-foreground">Total 20 data terakhir</p>
          <p className="text-xl font-bold text-green-600">
            {totalEnergy.toFixed(3)} kWh
          </p>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-6">
        Data energi dibaca dari histori perangkat.
      </p>

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
              <linearGradient
                id="energyGradientModern"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.6} />
                <stop offset="60%" stopColor="#22c55e" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>

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
              tickFormatter={(value) => new Date(value).toLocaleTimeString()}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />

            <YAxis
              fontSize={12}
              tickFormatter={(value) => Number(value).toFixed(1)}
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
              formatter={(value) => `${Number(value).toFixed(3)} kWh`}
            />

            <Area
              type="monotone"
              dataKey="energy"
              stroke="none"
              fill="url(#energyGradientModern)"
              isAnimationActive
            />

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
