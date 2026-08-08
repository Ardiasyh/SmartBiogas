"use client";

import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type RealtimeData = {
  temperature: number;
  pressure: number;
  flowrate: number;
  energy: number;
  timestamp?: string | number;
  index?: number;
};

type Props = {
  history: RealtimeData[];
  deviceId: string;
};

export default function ExportExcelButton({
  history,
  deviceId,
}: Props) {

  const formatTimestamp = (
    timestamp?: string | number
  ) => {
    if (!timestamp) return "-";

    // jika unix timestamp number
    if (typeof timestamp === "number") {
      return new Date(timestamp).toLocaleString();
    }

    // jika string timestamp
    return timestamp;
  };

  const exportToExcel = () => {
    if (!history.length) {
      toast.error("Belum ada histori yang dapat diexport.");
      return;
    }

    const excelData = history.map((d, i) => ({
      No: i + 1,

      Timestamp: formatTimestamp(d.timestamp),

      Temperature_C: d.temperature,
      Temperature_F: d.temperature * 1.8 + 32,

      Pressure_kPa: d.pressure,
      Pressure_Bar: d.pressure / 100,

      Flowrate_m3h: d.flowrate,
      Flowrate_Lmin: (d.flowrate * 1000) / 60,

      Energy_kWh: d.energy,
      Energy_MJ: d.energy * 3.6,
    }));

    const worksheet =
      XLSX.utils.json_to_sheet(excelData);

    worksheet["!cols"] = [
      { wch: 8 },   // No
      { wch: 24 },  // Timestamp
      { wch: 18 },  // Temp C
      { wch: 18 },  // Temp F
      { wch: 18 },  // Pressure kPa
      { wch: 18 },  // Pressure Bar
      { wch: 18 },  // Flowrate m3h
      { wch: 18 },  // Flowrate Lmin
      { wch: 18 },  // Energy kWh
      { wch: 18 },  // Energy MJ
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Biogas Data"
    );

    const now = new Date()
      .toISOString()
      .split("T")[0];

    try {
      XLSX.writeFile(
        workbook,
        `biogas-${deviceId}-${now}.xlsx`
      );
      toast.success(`${history.length} data diexport.`);
    } catch (error) {
      console.error("Gagal export Excel:", error);
      toast.error("Export gagal. Periksa console browser.");
    }
  };

  return (
    <Button
      onClick={exportToExcel}
      disabled={!history.length}
      className="rounded-xl shadow-sm hover:shadow-md transition-all"
    >
      {history.length ? `Export ${history.length} data` : "Menunggu histori"}
    </Button>
  );
}
