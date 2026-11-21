"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ChartRange = "7d" | "1m" | "3m";

export const CHART_RANGE_DAYS: Record<ChartRange, number> = {
  "7d": 7,
  "1m": 30,
  "3m": 90,
};

export const CHART_RANGE_LABELS: Record<ChartRange, string> = {
  "7d": "7 hari",
  "1m": "1 bulan",
  "3m": "3 bulan",
};

const RANGE_OPTIONS: Array<{ value: ChartRange; label: string }> = [
  { value: "7d", label: "7 Hari" },
  { value: "1m", label: "1 Bulan" },
  { value: "3m", label: "3 Bulan" },
];

export function ChartRangeSelector({
  value,
  onChange,
}: {
  value: ChartRange | null;
  onChange: (value: ChartRange) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Pilih rentang waktu chart"
      className="inline-flex w-full gap-1 rounded-lg border bg-background p-1 sm:w-auto"
    >
      {RANGE_OPTIONS.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={value === option.value}
          className={cn(
            "h-7 flex-1 px-2.5 text-xs sm:flex-none",
            value === option.value
              ? "bg-muted text-foreground shadow-sm hover:bg-muted"
              : "text-muted-foreground",
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

export function chartRangeStart(range: ChartRange) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (CHART_RANGE_DAYS[range] - 1));
  return start.getTime();
}

export function formatChartTick(timestamp: number, range: ChartRange) {
  return new Date(timestamp).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    ...(range === "7d" ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
