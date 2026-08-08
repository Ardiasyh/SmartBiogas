"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { watchDeviceTelemetry } from "@/lib/device-telemetry";
import type { Telemetry } from "@/lib/telemetry";

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
  const [energyUnit, setEnergyUnit] = useState<EnergyUnit>("kwh");

  const chartData = useMemo(
    () => rawLogs.map((log) => ({
      time: formatTime(log.timestamp),
      energy: convertEnergy(log.energy, energyUnit),
    })),
    [rawLogs, energyUnit],
  );

  useEffect(() => {
    const telemetry = new Map<string, Telemetry | null>();
    const stops = new Map<string, () => void>();

    const refresh = () => {
      const values = [...telemetry.values()].filter((value): value is Telemetry => value !== null);
      const now = Date.now();
      setTotalEnergy(values.reduce((total, value) => total + value.energy, 0));
      setOnlineDevices(values.filter((value) => now - value.timestamp <= OFFLINE_THRESHOLD).length);
      setOfflineDevices(Math.max(0, stops.size - values.filter((value) => now - value.timestamp <= OFFLINE_THRESHOLD).length));
      setRawLogs(values.map(({ timestamp, energy }) => ({ timestamp, energy })).sort((a, b) => a.timestamp - b.timestamp).slice(-20));
    };

    const unsubscribe = onSnapshot(collection(db, "users"), (snap) => {
      const deviceIds = new Set(
        snap.docs.map((document) => document.data().deviceId).filter((value): value is string => typeof value === "string" && value.length > 0),
      );
      setActiveUsers(deviceIds.size);

      stops.forEach((stop, deviceId) => {
        if (deviceIds.has(deviceId)) return;
        stop();
        stops.delete(deviceId);
        telemetry.delete(deviceId);
      });

      deviceIds.forEach((deviceId) => {
        if (stops.has(deviceId)) return;
        stops.set(deviceId, watchDeviceTelemetry(deviceId, (value) => {
          telemetry.set(deviceId, value);
          refresh();
        }));
      });
      refresh();
    });

    const interval = window.setInterval(refresh, 5_000);
    return () => {
      unsubscribe();
      window.clearInterval(interval);
      stops.forEach((stop) => stop());
    };
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
