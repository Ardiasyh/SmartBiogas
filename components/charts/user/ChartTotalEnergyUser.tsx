"use client";

import { useEffect, useMemo, useState } from "react";
import { ref, query, orderByChild, limitToLast, onValue } from "firebase/database";
import { Zap } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { rtdb } from "@/lib/firebase";
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
        const points: EnergyData[] = [];

        snapshot.forEach((child) => {
          const value = child.val();
          const timestamp = Number(value?.timestamp ?? 0);
          const flow = Number(value?.flowrate ?? 0);
          const storedEnergy = Number(value?.energy ?? 0);

          if (!timestamp) return;

          points.push({
            timestamp,
            energy:
              Number.isFinite(storedEnergy) && storedEnergy !== 0
                ? storedEnergy
                : calculateEnergyKwh(flow),
          });
        });

        points.sort((a, b) => a.timestamp - b.timestamp);
        setData(points);
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
    () => data.reduce((sum, point) => sum + point.energy, 0),
    [data],
  );

  const latestEnergy = useMemo(() => data.at(-1)?.energy ?? 0, [data]);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 shadow-[0_20px_60px_-42px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div className="flex flex-col gap-4 border-b border-border/60 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">Energy analytics</p>
            <h3 className="mt-1 text-lg font-bold tracking-tight">Energi Biogas</h3>
            <p className="text-xs text-muted-foreground">20 data history terbaru</p>
          </div>
        </div>

        <div className="flex gap-3">
          <MiniStat label="Latest" value={`${latestEnergy.toFixed(3)} kWh`} />
          <MiniStat label="Total" value={`${totalEnergy.toFixed(3)} kWh`} emphasis />
        </div>
      </div>

      <div className="h-[330px] p-3 pb-5 pt-6 sm:px-5">
        {loading ? (
          <ChartLoading />
        ) : data.length === 0 ? (
          <ChartEmpty />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="energyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="4 4" vertical={false} opacity={0.08} />
              <XAxis
                dataKey="timestamp"
                tickFormatter={(value) => new Date(value).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                tickLine={false}
                axisLine={false}
                fontSize={11}
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                fontSize={11}
                width={58}
                tickFormatter={(value) => Number(value).toFixed(2)}
              />
              <Tooltip
                cursor={{ strokeDasharray: "4 4", strokeOpacity: 0.25 }}
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid rgba(148,163,184,.2)",
                  background: "rgba(15,23,42,.92)",
                  color: "white",
                }}
                formatter={(value) => [`${Number(value).toFixed(3)} kWh`, "Energi"]}
                labelFormatter={(value) => new Date(Number(value)).toLocaleString("id-ID")}
              />
              <Area
                type="monotone"
                dataKey="energy"
                stroke="#22c55e"
                fill="url(#energyAreaGradient)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  emphasis = false,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-3 py-2 text-right ${
        emphasis
          ? "border-emerald-500/20 bg-emerald-500/10"
          : "border-border/70 bg-background/55"
      }`}
    >
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className={`mt-0.5 text-sm font-black ${emphasis ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function ChartLoading() {
  return (
    <div className="flex h-full items-end gap-2 px-3 pb-6">
      {[30, 48, 40, 65, 52, 78, 60, 82, 68, 88].map((height, index) => (
        <div key={index} className="flex-1 animate-pulse rounded-t-lg bg-muted" style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

function ChartEmpty() {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data energi.</div>;
}
