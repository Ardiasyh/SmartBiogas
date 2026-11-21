"use client";

import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { FileSpreadsheet, Gauge, Pause, Play, RotateCcw, Thermometer, TimerReset, Upload, Wind, Zap, type LucideIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";

import { getHistoryBounds, getHistoryRange, type HistoryPoint } from "@/lib/device-history";
import { AREA_CHART_MARGIN, paddedChartDomain } from "@/lib/chart-domain";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

const HOUR_MS = 60 * 60 * 1000;
const PLAYBACK_STEP_MS = 300;
const CHART_WINDOW_SIZE = 5;

const chartConfigs = {
  flowrate: { flowrate: { label: "Flowrate", color: "var(--chart-2)" } },
  pressure: { pressure: { label: "Tekanan", color: "var(--chart-3)" } },
  powerKw: { powerKw: { label: "Daya biogas", color: "var(--chart-4)" } },
  massKgph: { massKgph: { label: "Laju massa", color: "var(--chart-1)" } },
  temperature: { temperature: { label: "Suhu", color: "var(--chart-5)" } },
} satisfies Record<MetricKey, ChartConfig>;

type MetricKey = "flowrate" | "pressure" | "powerKw" | "temperature" | "massKgph";
type Metric = { key: MetricKey; label: string; unit: string };
type FlowUnit = "m3h" | "lmin";
type PowerUnit = "kw" | "w";
type PressureUnit = "kpa" | "bar";

const METRICS: Metric[] = [
  { key: "flowrate", label: "Flowrate", unit: "m³/h" },
  { key: "pressure", label: "Tekanan", unit: "kPa" },
  { key: "temperature", label: "Suhu", unit: "°C" },
  { key: "powerKw", label: "Daya biogas", unit: "kW" },
  { key: "massKgph", label: "Laju massa", unit: "kg/h" },
];

export default function HistoryReplay({ deviceId }: { deviceId: string }) {
  const [records, setRecords] = useState<HistoryPoint[]>([]);
  const [source, setSource] = useState<"firebase" | "excel">("firebase");
  const [cursor, setCursor] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [quickMinutes, setQuickMinutes] = useState<number | null>(60);
  const [flowUnit, setFlowUnit] = useState<FlowUnit>("m3h");
  const [powerUnit, setPowerUnit] = useState<PowerUnit>("kw");
  const [pressureUnit, setPressureUnit] = useState<PressureUnit>("kpa");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableRange, setAvailableRange] = useState<{ from: number; to: number } | null>(null);
  const [boundsLoading, setBoundsLoading] = useState(true);
  const [boundsError, setBoundsError] = useState<string | null>(null);
  const [queryRange, setQueryRange] = useState(() => {
    const to = Date.now();
    return { from: to - HOUR_MS, to };
  });
  const [fromInput, setFromInput] = useState(() => toDateTimeInput(Date.now() - HOUR_MS));
  const [toInput, setToInput] = useState(() => toDateTimeInput(Date.now()));
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (source !== "firebase") return;
    let cancelled = false;
    setBoundsLoading(true);
    setBoundsError(null);
    setAvailableRange(null);

    getHistoryBounds(deviceId)
      .then((range) => {
        if (!cancelled) setAvailableRange(range);
      })
      .catch((boundsLoadError: unknown) => {
        if (!cancelled) {
          setBoundsError(boundsLoadError instanceof Error ? boundsLoadError.message : "Batas waktu data gagal dimuat.");
        }
      })
      .finally(() => {
        if (!cancelled) setBoundsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [deviceId, source]);

  useEffect(() => {
    if (source !== "firebase") return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setRecords([]);
    setCursor(0);
    setPlaying(false);

    getHistoryRange(deviceId, queryRange)
      .then((history) => {
        if (!cancelled) {
          setRecords(history);
        }
      })
      .catch((loadError: unknown) => {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Gagal memuat histori satu jam.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [deviceId, queryRange, source]);

  const sessionRecords = useMemo(
    () => source === "excel"
      ? records.filter((record) => record.timestamp >= queryRange.from && record.timestamp <= queryRange.to)
      : records,
    [records, source, queryRange],
  );

  useEffect(() => {
    if (!playing || sessionRecords.length < 2) return;

    const interval = window.setInterval(() => {
      setCursor((current) => Math.min(current + 1, sessionRecords.length - 1));
    }, PLAYBACK_STEP_MS / speed);

    return () => window.clearInterval(interval);
  }, [playing, sessionRecords.length, speed]);

  useEffect(() => {
    if (playing && sessionRecords.length > 0 && cursor >= sessionRecords.length - 1) {
      setPlaying(false);
    }
  }, [playing, cursor, sessionRecords.length]);

  const chartCursor = useDeferredValue(cursor);
  const currentRecord = sessionRecords[cursor];
  const chartCurrentRecord = sessionRecords[chartCursor];
  const firstRecord = sessionRecords[0];
  const lastRecord = sessionRecords.at(-1);
  const elapsedPlaybackMs = currentRecord && firstRecord
    ? Math.max(0, currentRecord.timestamp - firstRecord.timestamp)
    : 0;
  const totalPlaybackMs = firstRecord && lastRecord
    ? Math.max(0, lastRecord.timestamp - firstRecord.timestamp)
    : 0;
  const chartDomains = useMemo(() => ({
    flowrate: paddedChartDomain(sessionRecords.map((record) => record.flowrate)),
    powerKw: paddedChartDomain(sessionRecords.map((record) => record.powerKw)),
    massKgph: paddedChartDomain(sessionRecords.map((record) => record.massKgph ?? 0)),
    pressure: paddedChartDomain(sessionRecords.map((record) => record.pressure)),
    temperature: paddedChartDomain(sessionRecords.map((record) => record.temperature)),
  }), [sessionRecords]);
  const visibleChartData = useMemo(() => ({
    flowrate: getRecentChartPoints(sessionRecords, chartCursor),
    powerKw: getRecentChartPoints(sessionRecords, chartCursor),
    massKgph: getRecentChartPoints(sessionRecords, chartCursor),
    pressure: getRecentChartPoints(sessionRecords, chartCursor),
    temperature: getRecentChartPoints(sessionRecords, chartCursor),
  }), [sessionRecords, chartCursor]);
  const progress = sessionRecords.length > 1 ? (cursor / (sessionRecords.length - 1)) * 100 : 0;

  const startPlayback = () => {
    if (sessionRecords.length < 2) return;
    if (cursor >= sessionRecords.length - 1) setCursor(0);
    setPlaying(true);
  };

  const resetPlayback = () => {
    setPlaying(false);
    setCursor(0);
  };

  const setRecentRange = (minutes: number, endTimestamp?: number) => {
    const latestExcelTimestamp = source === "excel" ? records.at(-1)?.timestamp : undefined;
    const to = endTimestamp ?? latestExcelTimestamp ?? Date.now();
    const earliestTimestamp = endTimestamp === undefined
      ? source === "excel" ? records[0]?.timestamp : availableRange?.from
      : undefined;
    const from = Math.max(to - minutes * 60 * 1000, earliestTimestamp ?? Number.NEGATIVE_INFINITY);
    setFromInput(toDateTimeInput(from));
    setToInput(toDateTimeInput(to));
    setPlaying(false);
    setCursor(0);
    setQueryRange({ from, to });
    setQuickMinutes(minutes);
  };

  const applySelectedRange = () => {
    const from = new Date(fromInput).getTime();
    const to = new Date(toInput).getTime();
    if (!Number.isFinite(from) || !Number.isFinite(to) || from > to) {
      setError("Waktu mulai harus valid dan tidak boleh melewati waktu selesai.");
      return;
    }
    if (availableRange) {
      const earliestSelectable = Math.floor(availableRange.from / 60_000) * 60_000;
      const latestSelectable = Math.ceil(availableRange.to / 60_000) * 60_000;
      if (from < earliestSelectable || to > latestSelectable) {
        setError("Pilih waktu dalam batas rekaman yang tersedia untuk perangkat ini.");
        return;
      }
    }

    setError(null);
    setPlaying(false);
    setCursor(0);
    setQueryRange({ from, to });
    setQuickMinutes(null);
  };

  const importExcel = async (file?: File) => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setPlaying(false);

    try {
      const XLSX = await import("xlsx");
      const workbook = XLSX.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      const dataSheets = workbook.SheetNames.filter((name) => /^Biogas Data(?: \d+)?$/i.test(name));
      const sheetNames = dataSheets.length > 0 ? dataSheets : workbook.SheetNames;
      const imported: HistoryPoint[] = [];

      for (const sheetName of sheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, raw: true });
        rows.forEach((row, index) => {
          const timestamp = readTimestamp(row, XLSX);
          const flowrate = readMetric(row, ["Flowrate_m3h", "Flowrate_Lmin"], ["flowrate", "flow"]);
          const pressure = readMetric(row, ["Pressure_kPa", "Pressure_Bar"], ["pressure"]);
          // Energy_kWh/Energy_MJ are accepted for older exports; the firmware stored kW there.
          const powerKw = readMetric(row, ["Power_kW", "Power_W", "Energy_kWh", "Energy_MJ"], ["power_kW", "powerKw", "energy"]);
          const massKgph = readMetric(row, ["MassFlow_kgph", "Mass_kgph"], ["mass_kgph", "mass"]);
          const temperature = readMetric(row, ["Temperature_C", "Temperature_F"], ["temperature", "temp"]);

          if (!timestamp || flowrate === null || pressure === null) return;
          imported.push({
            key: `${sheetName}-${index}-${timestamp}`,
            timestamp,
            flowrate,
            pressure,
            powerKw: powerKw ?? 0,
            temperature: temperature ?? 0,
            ...(massKgph !== null ? { massKgph } : {}),
            status: typeof row.Status === "string" ? row.Status : undefined,
          });
        });
      }

      imported.sort((a, b) => a.timestamp - b.timestamp || a.key.localeCompare(b.key));
      if (imported.length === 0) {
        throw new Error("Tidak ada baris data yang cocok. Gunakan file hasil Export Excel dengan kolom Timestamp, Flowrate, dan Pressure.");
      }

      setSource("excel");
      setRecords(imported);
      setCursor(0);
      const from = imported[0].timestamp;
      const to = imported.at(-1)!.timestamp;
      setAvailableRange({ from, to });
      setBoundsError(null);
      setBoundsLoading(false);
      setQueryRange({ from, to });
      setQuickMinutes(null);
      setFromInput(toDateTimeInput(from));
      setToInput(toDateTimeInput(to));
      setFileName(file.name);
    } catch (importError: unknown) {
      setError(importError instanceof Error ? importError.message : "File Excel gagal dibaca.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">Riwayat dan pemutaran data</CardTitle>
              <Badge variant="secondary">Pemutaran data</Badge>
            </div>
            <CardDescription>
              Pilih waktu memasak untuk melihat perubahan sensor dan mengingat kapan setiap rekaman terjadi.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="sr-only"
              aria-label="Pilih file Excel hasil ekspor"
              onChange={(event) => void importExcel(event.target.files?.[0])}
            />
            <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Impor Excel
            </Button>
            {source === "excel" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={loading}
                onClick={() => {
                  setFileName("");
                  setSource("firebase");
                  setRecentRange(60, Date.now());
                }}
              >
                <TimerReset className="h-4 w-4" /> Kembali ke Firebase
              </Button>
            ) : (
              <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => setRecentRange(60)}>
                <TimerReset className="h-4 w-4" /> 1 jam terakhir
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 p-4">
        <div className="space-y-3 rounded-lg border bg-background p-3">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
              Waktu mulai
              <input
                type="datetime-local"
                value={fromInput}
                min={availableRange ? toDateTimeInput(Math.floor(availableRange.from / 60_000) * 60_000) : undefined}
                max={availableRange ? toDateTimeInput(Math.ceil(availableRange.to / 60_000) * 60_000) : undefined}
                onChange={(event) => setFromInput(event.target.value)}
                className="h-9 min-w-0 rounded-md border bg-background px-2 text-sm font-normal text-foreground"
              />
            </label>
            <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
              Waktu selesai
              <input
                type="datetime-local"
                value={toInput}
                min={availableRange ? toDateTimeInput(Math.floor(availableRange.from / 60_000) * 60_000) : undefined}
                max={availableRange ? toDateTimeInput(Math.ceil(availableRange.to / 60_000) * 60_000) : undefined}
                onChange={(event) => setToInput(event.target.value)}
                className="h-9 min-w-0 rounded-md border bg-background px-2 text-sm font-normal text-foreground"
              />
            </label>
            <Button type="button" variant="outline" onClick={applySelectedRange} disabled={loading}>
              Tampilkan rentang
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs text-muted-foreground">Rentang cepat:</span>
            {[5, 15, 30, 60].map((minutes) => (
              <Button
                key={minutes}
                type="button"
                size="sm"
                variant={quickMinutes === minutes ? "default" : "outline"}
                onClick={() => setRecentRange(minutes)}
                disabled={loading}
              >
                {minutes === 60 ? "1 jam" : `${minutes} menit`}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-md bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {boundsLoading ? (
            "Mencari rentang waktu rekaman perangkat…"
          ) : boundsError ? (
            `Rentang ketersediaan data tidak dapat dimuat: ${boundsError}`
          ) : availableRange ? (
            <>
              Rekaman tersedia sejak <span className="font-medium text-foreground">{new Date(availableRange.from).toLocaleString("id-ID")}</span>
              {" hingga "}
              <span className="font-medium text-foreground">{new Date(availableRange.to).toLocaleString("id-ID")}</span>
            </>
          ) : (
            "Belum ada rekaman untuk perangkat ini."
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {new Date(queryRange.from).toLocaleString("id-ID")} — {new Date(queryRange.to).toLocaleString("id-ID")}
          </span>
          <span className="flex items-center gap-1.5">
            {source === "excel" && <FileSpreadsheet className="h-3.5 w-3.5" />}
            {loading ? "Memuat rekaman…" : `${sessionRecords.length} rekaman${source === "excel" ? ` · ${fileName}` : " · Firebase"}`}
          </span>
        </div>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            Histori gagal dimuat: {error}
          </div>
        ) : loading ? (
          <div className="grid gap-3 md:grid-cols-3">
            {METRICS.map((metric) => <div key={metric.key} className="h-[240px] animate-pulse rounded-lg border bg-muted/30" />)}
          </div>
        ) : sessionRecords.length === 0 ? (
          <div className="flex min-h-40 items-center justify-center rounded-lg border border-dashed px-4 text-center text-sm text-muted-foreground">
            Tidak ada rekaman pada rentang waktu yang dipilih.
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-5">
              <HistoryMetricCard
                label="Flowrate"
                value={formatMetric(currentRecord?.flowrate, flowUnit === "m3h" ? 3 : 2, flowUnit === "m3h" ? 1 : 1000 / 60)}
                unit={flowUnit === "m3h" ? "m³/h" : "L/min"}
                icon={Wind}
                tone="text-sky-600 dark:text-sky-300"
                selectedUnit={flowUnit}
                unitOptions={[["m3h", "m³/h"], ["lmin", "L/min"]]}
                onUnitChange={(value) => setFlowUnit(value as FlowUnit)}
              />
              <HistoryMetricCard
                label="Tekanan"
                value={formatMetric(currentRecord?.pressure, 3, pressureUnit === "bar" ? 0.01 : 1)}
                unit={pressureUnit === "kpa" ? "kPa" : "bar"}
                icon={Gauge}
                tone="text-amber-600 dark:text-amber-300"
                selectedUnit={pressureUnit}
                unitOptions={[["kpa", "kPa"], ["bar", "bar"]]}
                onUnitChange={(value) => setPressureUnit(value as PressureUnit)}
              />
              <HistoryMetricCard
                label="Suhu"
                value={formatMetric(currentRecord?.temperature, 2)}
                unit="°C"
                icon={Thermometer}
                tone="text-rose-600 dark:text-rose-300"
              />
              <HistoryMetricCard
                label="Daya biogas"
                value={formatMetric(currentRecord?.powerKw, 3, powerUnit === "w" ? 1000 : 1)}
                unit={powerUnit === "kw" ? "kW" : "W"}
                icon={Zap}
                tone="text-violet-600 dark:text-violet-300"
                selectedUnit={powerUnit}
                unitOptions={[["kw", "kW"], ["w", "W"]]}
                onUnitChange={(value) => setPowerUnit(value as PowerUnit)}
              />
              <HistoryMetricCard
                label="Laju massa"
                value={formatMetric(currentRecord?.massKgph, 3)}
                unit="kg/h"
                icon={Wind}
                tone="text-emerald-600 dark:text-emerald-300"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-5">
              {METRICS.map((metric) => (
                <MetricReplayChart
                  key={metric.key}
                  metric={metric}
                  data={visibleChartData[metric.key]}
                  domain={chartDomains[metric.key]}
                  currentValue={chartCurrentRecord?.[metric.key] ?? 0}
                />
              ))}
            </div>
            <p className="-mt-2 text-xs text-muted-foreground">
              Grafik menampilkan maksimal {CHART_WINDOW_SIZE} rekaman terakhir hingga waktu pemutaran yang dipilih.
            </p>

            <div className="space-y-3 rounded-lg border bg-muted/10 p-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    onClick={playing ? () => setPlaying(false) : startPlayback}
                    disabled={sessionRecords.length < 2}
                  >
                    {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {playing ? "Jeda" : "Putar"}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={resetPlayback} disabled={playing}>
                    <RotateCcw className="h-4 w-4" /> Awal
                  </Button>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Kecepatan
                    <select
                      aria-label="Kecepatan pemutaran"
                      value={speed}
                      onChange={(event) => setSpeed(Number(event.target.value))}
                      className="h-8 rounded-md border bg-background px-2 text-xs text-foreground"
                    >
                      <option value={0.5}>0,5×</option>
                      <option value={1}>1×</option>
                      <option value={2}>2×</option>
                      <option value={4}>4×</option>
                    </select>
                  </label>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div>
                    {currentRecord
                      ? formatPlaybackTimestamp(currentRecord.timestamp)
                      : "Pilih posisi rekaman"}
                  </div>
                  <div className="mt-0.5 tabular-nums">
                    Posisi rekaman {formatPlaybackDuration(elapsedPlaybackMs)} / {formatPlaybackDuration(totalPlaybackMs)}
                  </div>
                </div>
              </div>
              <input
                aria-label="Posisi pemutaran histori"
                type="range"
                min={0}
                max={Math.max(0, sessionRecords.length - 1)}
                step={1}
                value={cursor}
                onChange={(event) => {
                  setPlaying(false);
                  setCursor(Number(event.target.value));
                }}
                style={{ "--replay-progress": `${progress}%` } as CSSProperties}
                className="h-2 w-full cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Mulai: {firstRecord ? formatPlaybackTimestamp(firstRecord.timestamp) : "—"}</span>
                <span className="text-right">Selesai: {lastRecord ? formatPlaybackTimestamp(lastRecord.timestamp) : "—"}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function normalizeColumn(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function toDateTimeInput(timestamp: number) {
  const date = new Date(timestamp);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function formatMetric(value: number | undefined, digits: number, multiplier = 1) {
  return value === undefined ? "—" : (value * multiplier).toFixed(digits);
}

function formatPlaybackDuration(durationMs: number) {
  const totalSeconds = Math.floor(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, "0")).join(":");
}

function formatPlaybackTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function HistoryMetricCard({
  label,
  value,
  unit,
  icon: Icon,
  tone,
  selectedUnit,
  unitOptions,
  onUnitChange,
}: {
  label: string;
  value: string;
  unit: string;
  icon: LucideIcon;
  tone: string;
  selectedUnit?: string;
  unitOptions?: Array<[string, string]>;
  onUnitChange?: (unit: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/20 ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
        {unitOptions && onUnitChange && (
          <select
            aria-label={`Satuan ${label}`}
            value={selectedUnit}
            onChange={(event) => onUnitChange(event.target.value)}
            className="h-8 rounded-md border bg-background px-2 text-xs"
          >
            {unitOptions.map(([key, optionLabel]) => (
              <option key={key} value={key}>{optionLabel}</option>
            ))}
          </select>
        )}
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
          <span className="text-xs text-muted-foreground">{unit}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function readCell(row: Record<string, unknown>, names: string[]) {
  const accepted = new Set(names.map(normalizeColumn));
  const entry = Object.entries(row).find(([key]) => accepted.has(normalizeColumn(key)));
  return entry?.[1] ?? null;
}

function parseNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim()) return null;

  const normalized = value.trim().replace(/\s/g, "");
  const parsed = normalized.includes(",")
    ? Number(normalized.replace(/\./g, "").replace(",", "."))
    : Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function readMetric(
  row: Record<string, unknown>,
  exportedColumns: string[],
  alternateColumns: string[],
) {
  for (const column of exportedColumns) {
    const value = readCell(row, [column]);
    if (value === null) continue;
    const parsed = parseNumber(value);
    if (parsed === null) continue;
    if (column.endsWith("_Lmin")) return (parsed * 60) / 1000;
    if (column.endsWith("_Bar")) return parsed * 100;
    if (column.endsWith("_MJ")) return parsed / 3.6;
    if (column.endsWith("_W")) return parsed / 1000;
    if (column.endsWith("_F")) return ((parsed - 32) * 5) / 9;
    return parsed;
  }

  const value = parseNumber(readCell(row, alternateColumns));
  return value;
}

function readTimestamp(row: Record<string, unknown>, XLSX: typeof import("xlsx")) {
  const unixValue = parseNumber(readCell(row, ["Timestamp_Unix_ms", "timestampUnixMs"]));
  if (unixValue !== null && unixValue > 0) {
    return unixValue < 1_000_000_000_000 ? unixValue * 1000 : unixValue;
  }

  const value = readCell(row, ["Timestamp", "Date", "Datetime", "Waktu"]);
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.getTime();
  if (typeof value === "number") {
    const parts = XLSX.SSF.parse_date_code(value);
    if (parts) {
      return new Date(
        parts.y,
        parts.m - 1,
        parts.d,
        parts.H,
        parts.M,
        Math.floor(parts.S),
      ).getTime();
    }
  }
  if (typeof value !== "string") return null;

  const localDate = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[, ]+)(\d{1,2})[:.](\d{2})(?:[:.](\d{2}))?/);
  if (localDate) {
    const [, day, month, year, hour, minute, second = "0"] = localDate;
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second)).getTime();
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getRecentChartPoints(records: HistoryPoint[], cursor: number) {
  if (records.length === 0 || cursor < 0) return [];
  const end = Math.min(cursor, records.length - 1);
  const start = Math.max(0, end - CHART_WINDOW_SIZE + 1);
  return records.slice(start, end + 1);
}

const MetricReplayChart = memo(function MetricReplayChart({
  metric,
  data,
  domain,
  currentValue,
}: {
  metric: Metric;
  data: HistoryPoint[];
  domain: [number, number];
  currentValue: number;
}) {
  const config = chartConfigs[metric.key];

  return (
    <div className="min-w-0 rounded-lg border bg-background p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{metric.label}</p>
        <p className="text-sm tabular-nums text-muted-foreground">
          {Number(currentValue).toFixed(3)} {metric.unit}
        </p>
      </div>
      {data.length < 2 ? (
        <div className="flex h-[190px] items-center justify-center text-xs text-muted-foreground">
          Tekan Putar atau geser timeline untuk melihat perubahan.
        </div>
      ) : (
        <ChartContainer config={config} className="h-[190px] w-full aspect-auto">
          <AreaChart accessibilityLayer data={data} margin={AREA_CHART_MARGIN}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={(value) => new Date(Number(value)).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis hide domain={domain} />
            <ChartTooltip
              cursor={{ stroke: "var(--border)", strokeDasharray: "3 4" }}
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(label) => new Date(Number(label)).toLocaleString("id-ID")}
                  valueFormatter={(value) => `${Number(value).toFixed(3)} ${metric.unit}`}
                />
              }
            />
            <Area
              type="monotone"
              dataKey={metric.key}
              stroke={`var(--color-${metric.key})`}
              fill={`var(--color-${metric.key})`}
              fillOpacity={0.12}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
});
