"use client";

import { useEffect, useMemo, useState } from "react";
import { ref, query, orderByChild, limitToLast, onValue } from "firebase/database";
import { Gauge } from "lucide-react";
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

interface PressureData {
  timestamp: number;
  pressure: number;
}

interface Props {
  deviceId: string;
}

export default function ChartPressureUser({ deviceId }: Props) {
  const [data, setData] = useState<PressureData[]>([]);
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
        const points: PressureData[] = [];

        snapshot.forEach((child) => {
          const value = child.val();
          const timestamp = Number(value?.timestamp ?? 0);
          if (!timestamp) return;

          points.push({
            timestamp,
            pressure: Number(value?.pressure ?? 0),
          });
        });

        points.sort((a, b) => a.timestamp - b.timestamp);
        setData(points);
        setLoading(false);
      },
      (error) => {
        console.error(`[RTDB] Gagal membaca pressure device ${deviceId}:`, error);
        setData([]);
        setLoading(false);
      },
    );
  }, [deviceId]);

  const latest = useMemo(() => data.at(-1)?.pressure ?? 0, [data]);

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border/70 bg-card/75 shadow-[0_20px_60px_-42px_rgba(0,0,0,0.5)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-4 border-b border-border/60 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">Pressure analytics</p>
            <h3 className="mt-1 text-lg font-bold tracking-tight">Tekanan Gas</h3>
            <p className="text-xs text-muted-foreground">20 data terbaru</p>
          </div>
        </div>

        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">Latest</p>
          <p className="mt-1 text-xl font-black tracking-tight">{latest.toFixed(3)}</p>
          <p className="text-[11px] font-semibold text-muted-foreground">kPa</p>
        </div>
      </div>

      <div className="h-[300px] p-3 pb-5 pt-6 sm:px-5">
        {loading ? (
          <ChartLoading />
        ) : data.length === 0 ? (
          <ChartEmpty />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="pressureAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
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
              <YAxis tickLine={false} axisLine={false} fontSize={11} width={58} />
              <Tooltip
                cursor={{ strokeDasharray: "4 4", strokeOpacity: 0.25 }}
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid rgba(148,163,184,.2)",
                  background: "rgba(15,23,42,.92)",
                  color: "white",
                }}
                formatter={(value) => [`${Number(value).toFixed(3)} kPa`, "Pressure"]}
                labelFormatter={(value) => new Date(Number(value)).toLocaleString("id-ID")}
              />
              <Area
                type="monotone"
                dataKey="pressure"
                stroke="#f59e0b"
                fill="url(#pressureAreaGradient)"
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

function ChartLoading() {
  return (
    <div className="flex h-full items-end gap-2 px-3 pb-6">
      {[48, 55, 45, 70, 63, 76, 67, 72, 58, 64].map((height, index) => (
        <div key={index} className="flex-1 animate-pulse rounded-t-lg bg-muted" style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

function ChartEmpty() {
  return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Belum ada data tekanan.</div>;
}
