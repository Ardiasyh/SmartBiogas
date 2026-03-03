"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "@/lib/firebase";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Clock, User } from "lucide-react";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

// TYPES
type RealtimeUserData = {
  energy: number;
  pressure: number;
  flowrate: number;
  temperature: number;
  timestamp: number;
};

type DailyData = {
  date: string;
  value: number;
};

type WeeklyData = {
  week: string;
  value: number;
};

export default function UsersInsight({ deviceId }: { deviceId: string }) {
  const [data, setData] = useState<RealtimeUserData | null>(null);
  const [status, setStatus] = useState("offline");
  const [lastActive, setLastActive] = useState("-");

  const [daily, setDaily] = useState<DailyData[]>([]);
  const [weekly, setWeekly] = useState<WeeklyData[]>([]);

  // ===============================
  // REALTIME DATA LISTENER
  // ===============================
  useEffect(() => {
    if (!deviceId) return;

    const dataRef = ref(rtdb, `biogasData/${deviceId}/datauser`);

    const unsub = onValue(dataRef, (snap) => {
      const val = snap.val();
      if (!val) return;

      const casted: RealtimeUserData = {
        energy: val.energy || 0,
        pressure: val.pressure || 0,
        temperature: val.temperature || 0,
        flowrate: val.flowrate || 0,
        timestamp: val.timestamp || 0,
      };

      setData(casted);

      // Status Online
      const now = Date.now();
      const diffSec = (now - casted.timestamp) / 1000;
      setStatus(diffSec < 20 ? "online" : "offline");

      setLastActive(new Date(casted.timestamp).toLocaleString());
    });

    return () => unsub();
  }, [deviceId]);

  // ===============================
  // DAILY LOGS LISTENER
  // ===============================
  useEffect(() => {
    if (!deviceId) return;

    const logsRef = ref(rtdb, `biogasData/${deviceId}/dailyLogs`);

    const unsub = onValue(logsRef, (snap) => {
      const val = snap.val();
      if (!val) {
        setDaily([]);
        return;
      }

      const arr: DailyData[] = [];

      Object.keys(val).forEach((dateKey) => {
        Object.values(val[dateKey]).forEach((entry: any) => {
          arr.push({
            date: new Date(entry.timestamp).toLocaleTimeString(),
            value: entry.energy || entry.gasVolume || 0,
          });
        });
      });

      setDaily(arr.slice(-100)); // biar ringan
    });

    return () => unsub();
  }, [deviceId]);

  // ===============================
  // WEEKLY AGGREGATION
  // ===============================
  useEffect(() => {
    if (daily.length === 0) {
      setWeekly([]);
      return;
    }

    const grouped: Record<number, number> = {};

    daily.forEach((d, i) => {
      const groupIndex = Math.floor(i / 7);
      grouped[groupIndex] = (grouped[groupIndex] || 0) + d.value;
    });

    const weeklyArr: WeeklyData[] = Object.keys(grouped).map((w) => ({
      week: `Week ${Number(w) + 1}`,
      value: grouped[Number(w)],
    }));

    setWeekly(weeklyArr);
  }, [daily]);

  // ===============================
  // RENDER
  // ===============================
  if (!data) {
    return <p className="text-sm text-muted-foreground">Memuat data…</p>;
  }

  return (
    <Card className="border rounded-xl p-4 hover:shadow-lg transition-all">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <User size={20} /> Device {deviceId}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        {/* STATUS */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <p className={status === "online" ? "text-green-500" : "text-red-500"}>
              {status}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">Last Active</p>
            <p className="flex items-center gap-1">
              <Clock size={15} /> {lastActive}
            </p>
          </div>
        </div>

        {/* DAILY */}
        <div>
          <p className="font-medium text-sm mb-1">Produksi Harian</p>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line dataKey="value" stroke="currentColor" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* WEEKLY */}
        <div>
          <p className="font-medium text-sm mb-1">Produksi Mingguan</p>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="week" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line dataKey="value" stroke="currentColor" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
