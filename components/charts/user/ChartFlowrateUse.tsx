"use client";

import { useEffect, useState } from "react";
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

interface FlowData {
  timestamp: number;
  flow: number;
}

interface Props {
  deviceId: string;
}

export default function ChartFlowrateUser({ deviceId }: Props) {
  const [data, setData] = useState<FlowData[]>([]);

  useEffect(() => {
    if (!deviceId) return;

    const logsRef = query(
      ref(rtdb, `biogasData/${deviceId}/logs`),
      orderByChild("timestamp"),
      limitToLast(20)
    );

    onValue(logsRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const temp: FlowData[] = [];

      snapshot.forEach((child) => {
        const val = child.val();

        temp.push({
          timestamp: Number(val.timestamp ?? 0),
          flow: Number(val.flowrate ?? 0),
        });
      });

      temp.sort((a, b) => a.timestamp - b.timestamp);
      setData(temp);
    });

    return () => off(logsRef);
  }, [deviceId]);

  return (
    <div className="w-full h-[380px] bg-card border rounded-2xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-6">
        Flowrate Biogas (20 data terbaru)
      </h2>

      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}>
          <defs>
            <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />

          <XAxis
            dataKey="timestamp"
            tickFormatter={(v) => new Date(v).toLocaleTimeString()}
            fontSize={12}
          />

          <YAxis fontSize={12} />

          <Tooltip
            formatter={(value: number) => `${value.toFixed(2)} m³/s`}
            labelFormatter={(v) =>
              new Date(v as number).toLocaleString()
            }
          />

          <Area
            type="monotone"
            dataKey="flow"
            stroke="none"
            fill="url(#flowGradient)"
          />

          <Line
            type="monotone"
            dataKey="flow"
            stroke="#2563eb"
            strokeWidth={3}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
