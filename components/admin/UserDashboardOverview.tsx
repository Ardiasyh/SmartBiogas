"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { collection, onSnapshot } from "firebase/firestore";
import { rtdb, db } from "@/lib/firebase";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

/* ================= KONSTANTA ================= */

const OFFLINE_THRESHOLD = 15000;

type EnergyUnit = "kwh" | "mj";

type RawLog = {
  timestamp: number;
  energy: number;
};

function formatTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString();
}

function convertEnergy(value: number, unit: EnergyUnit) {
  return unit === "mj" ? value * 3.6 : value;
}

export default function AdminDashboardOverview() {
  const [totalEnergy, setTotalEnergy] = useState(0);
  const [activeUsers, setActiveUsers] = useState(0);
  const [onlineDevices, setOnlineDevices] = useState(0);
  const [offlineDevices, setOfflineDevices] = useState(0);

  const [rawLogs, setRawLogs] = useState<RawLog[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [energyUnit, setEnergyUnit] = useState<EnergyUnit>("kwh");

  /* ================= REALTIME DEVICE DATA ================= */

  useEffect(() => {
    const dataRef = ref(rtdb, "biogasData");

    const unsubscribe = onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      let totalEnergyLocal = 0;
      let online = 0;
      let offline = 0;
      const now = Date.now();
      const allLogs: RawLog[] = [];

      Object.entries<any>(data).forEach(([deviceId, deviceNode]) => {
        const logs = deviceNode?.logs;
        if (!logs) {
          offline++;
          return;
        }

        const logArray = Object.values<any>(logs);

        if (logArray.length === 0) {
          offline++;
          return;
        }

        const latestLog = logArray.reduce((latest, current) => {
          const currentTs = Number(current.timestamp || 0);
          const latestTs = Number(latest?.timestamp || 0);
          return currentTs > latestTs ? current : latest;
        });

        const latestTimestamp = Number(latestLog.timestamp || 0);
        const latestEnergy = Number(latestLog.energy || 0);

        totalEnergyLocal += latestEnergy;

        const diff = now - latestTimestamp;
        diff <= OFFLINE_THRESHOLD ? online++ : offline++;

        logArray.forEach((log) => {
          allLogs.push({
            timestamp: Number(log.timestamp || 0),
            energy: Number(log.energy || 0),
          });
        });
      });

      setTotalEnergy(totalEnergyLocal);
      setOnlineDevices(online);
      setOfflineDevices(offline);

      allLogs.sort((a, b) => a.timestamp - b.timestamp);
      const last20 = allLogs.slice(-20);
      setRawLogs(last20);
    });

    return () => unsubscribe();
  }, []);

  /* ================= CHART UPDATE SAAT UNIT BERUBAH ================= */

  useEffect(() => {
    const formatted = rawLogs.map((log) => ({
      time: formatTime(log.timestamp),
      energy: convertEnergy(log.energy, energyUnit),
    }));

    setChartData(formatted);
  }, [rawLogs, energyUnit]);

  /* ================= USER COUNT ================= */

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "users"), (snap) => {
      const users = snap.docs.map((d) => d.data());
      setActiveUsers(users.filter((u: any) => u.deviceId).length);
    });

    return () => unsubscribe();
  }, []);

  const displayEnergy = convertEnergy(totalEnergy, energyUnit);

  const pieData = [
    { name: "Online", value: onlineDevices },
    { name: "Offline", value: offlineDevices },
  ];

  return (
    <div className="space-y-8">

      {/* ===== METRIC CARDS ===== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

        <MetricCard
          title="Total Energi Sistem"
          value={displayEnergy.toFixed(3)}
          unit={energyUnit === "kwh" ? "kWh" : "MJ"}
          extra={
            <select
              value={energyUnit}
              onChange={(e) => setEnergyUnit(e.target.value as EnergyUnit)}
              className="mt-3 w-full border rounded px-2 py-1 text-sm bg-background"
            >
              <option value="kwh">kWh</option>
              <option value="mj">MJ</option>
            </select>
          }
        />

        <MetricCard title="User Aktif" value={activeUsers} />
        <MetricCard title="Device Online" value={onlineDevices} highlight="green" />
        <MetricCard title="Device Offline" value={offlineDevices} highlight="red" />
      </div>

      {/* ===== ENERGY TREND ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Energi (20 Data Terakhir)</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => [
                  `${value.toFixed(3)} ${
                    energyUnit === "kwh" ? "kWh" : "MJ"
                  }`,
                  "Energi",
                ]}
              />
              <Area
                type="monotone"
                dataKey="energy"
                stroke="#22c55e"
                fill="url(#energyGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ===== DEVICE DISTRIBUTION ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Distribusi Status Device</CardTitle>
        </CardHeader>
        <CardContent style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" outerRadius={100}>
                <Cell fill="#22c55e" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

/* ================= METRIC CARD ================= */

function MetricCard({
  title,
  value,
  unit,
  highlight,
  extra,
}: {
  title: string;
  value: number | string;
  unit?: string;
  highlight?: "green" | "red";
  extra?: React.ReactNode;
}) {
  const color =
    highlight === "green"
      ? "text-green-600"
      : highlight === "red"
      ? "text-red-600"
      : "text-foreground";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${color}`}>
          {value} {unit && <span className="text-base">{unit}</span>}
        </div>
        {extra}
      </CardContent>
    </Card>
  );
}
