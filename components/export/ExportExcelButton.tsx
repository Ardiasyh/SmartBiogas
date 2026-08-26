"use client"

import { useState } from "react"
import { Download, LoaderCircle } from "lucide-react"
import { toast } from "sonner"

import { getAllHistory } from "@/lib/device-history"
import { Button } from "@/components/ui/button"

const ROWS_PER_SHEET = 100_000

type Props = {
  deviceId: string
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString("id-ID", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export default function ExportExcelButton({
  deviceId,
  variant = "default",
  size = "default",
  className,
}: Props) {
  const [exporting, setExporting] = useState(false)
  const [loadedCount, setLoadedCount] = useState(0)

  const exportToExcel = async () => {
    if (!deviceId || exporting) return

    setExporting(true)
    setLoadedCount(0)

    try {
      const history = await getAllHistory(deviceId, {
        pageSize: 1000,
        onProgress: setLoadedCount,
      })

      if (!history.length) {
        toast.error("Belum ada histori yang dapat diekspor.")
        return
      }

      // XLSX dimuat hanya ketika export dilakukan agar bundle awal dashboard tetap ringan.
      const XLSX = await import("xlsx")
      const workbook = XLSX.utils.book_new()

      for (let start = 0; start < history.length; start += ROWS_PER_SHEET) {
        const page = history.slice(start, start + ROWS_PER_SHEET)
        const excelData = page.map((data, pageIndex) => ({
          No: start + pageIndex + 1,
          Timestamp: formatTimestamp(data.timestamp),
          Timestamp_Unix_ms: data.timestamp,
          Temperature_C: data.temperature,
          Temperature_F: data.temperature * 1.8 + 32,
          Pressure_kPa: data.pressure,
          Pressure_Bar: data.pressure / 100,
          Flowrate_m3h: data.flowrate,
          Flowrate_Lmin: (data.flowrate * 1000) / 60,
          Energy_kWh: data.energy,
          Energy_MJ: data.energy * 3.6,
          Status: data.status ?? "-",
        }))

        const worksheet = XLSX.utils.json_to_sheet(excelData)
        worksheet["!cols"] = [
          { wch: 9 },
          { wch: 22 },
          { wch: 18 },
          { wch: 17 },
          { wch: 17 },
          { wch: 17 },
          { wch: 17 },
          { wch: 17 },
          { wch: 17 },
          { wch: 17 },
          { wch: 17 },
          { wch: 14 },
        ]

        const sheetNumber = Math.floor(start / ROWS_PER_SHEET) + 1
        XLSX.utils.book_append_sheet(
          workbook,
          worksheet,
          history.length > ROWS_PER_SHEET
            ? `Biogas Data ${sheetNumber}`
            : "Biogas Data",
        )
      }

      const date = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(workbook, `biogas-${deviceId}-semua-data-${date}.xlsx`, {
        compression: true,
      })

      toast.success(`${history.length.toLocaleString("id-ID")} data berhasil diekspor.`)
    } catch (error) {
      console.error("Gagal export seluruh histori:", error)
      toast.error("Export gagal. Periksa koneksi dan izin Firebase.")
    } finally {
      setExporting(false)
      setLoadedCount(0)
    }
  }

  return (
    <Button
      type="button"
      onClick={exportToExcel}
      disabled={!deviceId || exporting}
      variant={variant}
      size={size}
      className={className}
    >
      {exporting ? (
        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      {exporting
        ? loadedCount > 0
          ? `Memuat ${loadedCount.toLocaleString("id-ID")} data...`
          : "Menyiapkan export..."
        : "Export semua data"}
    </Button>
  )
}
