"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Props = {
  from: string;
  to: string;
  onApply: (from: string, to: string) => void;
};

function dateValue(date?: Date) {
  if (!date) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function displayDate(date?: Date) {
  return date?.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function DateRangePicker({ from, to, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>(() => ({
    from: from ? new Date(`${from}T00:00:00`) : undefined,
    to: to ? new Date(`${to}T00:00:00`) : undefined,
  }));

  const label = range?.from
    ? `${displayDate(range.from)}${range.to ? ` – ${displayDate(range.to)}` : ""}`
    : "Pilih rentang tanggal";

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="min-w-64 justify-start font-normal">
          <CalendarDays />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-auto p-3">
        <DayPicker
          mode="range"
          selected={range}
          onSelect={setRange}
          showOutsideDays
        />
        <div className="mt-3 flex justify-between border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setRange(undefined);
              onApply("", "");
              setOpen(false);
            }}
          >
            Hapus
          </Button>
          <Button
            size="sm"
            disabled={!range?.from || !range.to}
            onClick={() => {
              onApply(dateValue(range?.from), dateValue(range?.to));
              setOpen(false);
            }}
          >
            Terapkan
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
