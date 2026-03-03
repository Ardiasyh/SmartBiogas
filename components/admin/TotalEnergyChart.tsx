"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { rtdb } from "@/lib/firebase";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";

type EnergyPoint = {
  time: string;
  energy: number;
};

type RangeType = "1d" | "7d" | "1m" | "3m";

export default function TotalEnergyChart() {
  const [data, setData] = useState<EnergyPoint[]>([]);
  const [range, setRange] = useState<RangeType>("7d");

  useEffect(() => {
    const dataRef = ref(rtdb, "biogasData");

    return onValue(dataRef, (snap) => {
      const raw = snap.val();
      if (!raw) return;

      const now = Date.now();
      const rangeMs = getRangeMs(range);

      const filtered: any[] = [];

      Object.values<any>(raw).forEach((device) => {
        if (!device.timestamp || !device.energy) return;

        const diff = now - device.timestamp;

        if (diff <= rangeMs) {
          filtered.push({
            timestamp: device.timestamp,
            energy: device.energy
          });
        }
      });

      // sort by time
      filtered.sort((a, b) => a.timestamp - b.timestamp);

      const formatted: EnergyPoint[] = filtered.map((d) => ({
        time: formatTime(d.timestamp, range),
        energy: d.energy
      }));

      setData(formatted);
    });
  }, [range]);

  return (
    <div className="space-y-4">
      {/* FILTER BUTTON */}
      <div className="flex gap-2 flex-wrap">
        <RangeButton label="1 Hari" value="1d" active={range} onClick={setRange} />
        <RangeButton label="1 Minggu" value="7d" active={range} onClick={setRange} />
        <RangeButton label="1 Bulan" value="1m" active={range} onClick={setRange} />
        <RangeButton label="3 Bulan" value="3m" active={range} onClick={setRange} />
      </div>

      {/* CHART */}
      <div className="w-full h-80 bg-card rounded-xl p-4 border">
        <ResponsiveContainer>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Area
              type="monotone"
              dataKey="energy"
              strokeWidth={2}
              fillOpacity={0.3}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ================= UTIL ================= */

function getRangeMs(range: RangeType) {
  switch (range) {
    case "1d":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    case "1m":
      return 30 * 24 * 60 * 60 * 1000;
    case "3m":
      return 90 * 24 * 60 * 60 * 1000;
  }
}

function formatTime(timestamp: number, range: RangeType) {
  const date = new Date(timestamp);

  if (range === "1d") {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  return date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short"
  });
}

/* ================= BUTTON ================= */

function RangeButton({
  label,
  value,
  active,
  onClick
}: {
  label: string;
  value: RangeType;
  active: RangeType;
  onClick: (v: RangeType) => void;
}) {
  const isActive = active === value;

  return (
    <button
      onClick={() => onClick(value)}
      className={`px-3 py-1 text-sm rounded-md border transition
        ${
          isActive
            ? "bg-primary text-white"
            : "bg-muted hover:bg-muted/70"
        }`}
    >
      {label}
    </button>
  );
}
