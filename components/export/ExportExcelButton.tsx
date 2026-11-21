"use client"

import { useState } from "react"
import { FileSpreadsheet, FileText, LoaderCircle } from "lucide-react"
import { toast } from "sonner"

import { getAllHistory, type HistoryPoint } from "@/lib/device-history"
import { Button } from "@/components/ui/button"

const ROWS_PER_SHEET = 100_000

type ExportFormat = "excel" | "pdf"

type Props = {
  deviceId: string
  history?: unknown[]
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

function numberStats(values: number[]) {
  if (values.length === 0) return { average: 0, min: 0, max: 0, total: 0 }
  let total = 0
  let min = Number.POSITIVE_INFINITY
  let max = Number.NEGATIVE_INFINITY
  values.forEach((value) => {
    total += value
    if (value < min) min = value
    if (value > max) max = value
  })
  return {
    average: total / values.length,
    min,
    max,
    total,
  }
}

function summarize(history: HistoryPoint[]) {
  return {
    flow: numberStats(history.map((item) => item.flowrate)),
    pressure: numberStats(history.map((item) => item.pressure)),
    temperature: numberStats(history.map((item) => item.temperature)),
    power: numberStats(history.map((item) => item.powerKw)),
    mass: numberStats(history.flatMap((item) => item.massKgph === undefined ? [] : [item.massKgph])),
  }
}

function summaryRows(history: HistoryPoint[]) {
  const stats = summarize(history)
  const first = history[0]?.timestamp
  const last = history.at(-1)?.timestamp

  return [
    ["Jumlah sampel", history.length.toLocaleString("id-ID"), "data"],
    ["Periode awal", first ? formatTimestamp(first) : "-", ""],
    ["Periode akhir", last ? formatTimestamp(last) : "-", ""],
    ["Rata-rata flowrate", stats.flow.average.toFixed(3), "m3/h"],
    ["Minimum flowrate", stats.flow.min.toFixed(3), "m3/h"],
    ["Maksimum flowrate", stats.flow.max.toFixed(3), "m3/h"],
    ["Rata-rata tekanan", stats.pressure.average.toFixed(3), "kPa"],
    ["Minimum tekanan", stats.pressure.min.toFixed(3), "kPa"],
    ["Maksimum tekanan", stats.pressure.max.toFixed(3), "kPa"],
    ["Rata-rata suhu", stats.temperature.average.toFixed(2), "C"],
    ["Minimum suhu", stats.temperature.min.toFixed(2), "C"],
    ["Maksimum suhu", stats.temperature.max.toFixed(2), "C"],
    ["Rata-rata daya biogas", stats.power.average.toFixed(3), "kW"],
    ["Daya minimum", stats.power.min.toFixed(3), "kW"],
    ["Daya maksimum", stats.power.max.toFixed(3), "kW"],
    ["Rata-rata laju massa", stats.mass.average.toFixed(3), "kg/h"],
  ]
}

function dailyRows(history: HistoryPoint[]) {
  const days = new Map<string, HistoryPoint[]>()
  history.forEach((point) => {
    const key = new Date(point.timestamp).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    const current = days.get(key) ?? []
    current.push(point)
    days.set(key, current)
  })

  return [...days.entries()].map(([date, points]) => {
    const stats = summarize(points)
    return [
      date,
      points.length.toLocaleString("id-ID"),
      stats.flow.average.toFixed(3),
      stats.pressure.average.toFixed(3),
      stats.temperature.average.toFixed(2),
      stats.power.average.toFixed(3),
      stats.mass.average.toFixed(3),
    ]
  })
}

export default function ExportExcelButton({
  deviceId,
  variant = "default",
  size = "default",
  className,
}: Props) {
  const [exporting, setExporting] = useState<ExportFormat | null>(null)
  const [loadedCount, setLoadedCount] = useState(0)

  const exportToExcel = async () => {
    if (!deviceId || exporting) return

    setExporting("excel")
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

      const summarySheet = XLSX.utils.json_to_sheet(
        summaryRows(history).map(([metric, value, unit]) => ({ Metric: metric, Value: value, Unit: unit })),
      )
      summarySheet["!cols"] = [{ wch: 28 }, { wch: 24 }, { wch: 12 }]
      XLSX.utils.book_append_sheet(workbook, summarySheet, "Ringkasan")

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
          Power_kW: data.powerKw,
          Power_W: data.powerKw * 1000,
          MassFlow_kgph: data.massKgph ?? null,
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
          { wch: 17 },
          { wch: 17 },
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
      setExporting(null)
      setLoadedCount(0)
    }
  }

  const exportToPdf = async () => {
    if (!deviceId || exporting) return

    setExporting("pdf")
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

      const [{ jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ])
      const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })

      pdf.setFillColor(15, 23, 42)
      pdf.rect(0, 0, 297, 30, "F")
      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(18)
      pdf.text("Laporan Monitoring Biogas", 14, 13)
      pdf.setFontSize(9)
      pdf.text(`Device: ${deviceId} | Dibuat: ${formatTimestamp(Date.now())}`, 14, 21)
      pdf.setTextColor(15, 23, 42)

      autoTable(pdf, {
        startY: 36,
        head: [["Ringkasan", "Nilai", "Satuan"]],
        body: summaryRows(history),
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [14, 116, 144], textColor: 255 },
        columnStyles: { 0: { cellWidth: 65 }, 1: { cellWidth: 45 }, 2: { cellWidth: 25 } },
        margin: { left: 14, right: 148 },
      })

      autoTable(pdf, {
        startY: 36,
        head: [["Tanggal", "Sampel", "Flow avg", "Pressure avg", "Suhu avg", "Daya avg (kW)", "Massa avg (kg/h)"]],
        body: dailyRows(history),
        theme: "striped",
        styles: { fontSize: 7.5, cellPadding: 1.8, halign: "right" },
        headStyles: { fillColor: [79, 70, 229], textColor: 255, halign: "center" },
        columnStyles: { 0: { halign: "left" } },
        margin: { left: 153, right: 14 },
      })

      const pageCount = pdf.getNumberOfPages()
      for (let page = 1; page <= pageCount; page += 1) {
        pdf.setPage(page)
        pdf.setDrawColor(226, 232, 240)
        pdf.line(14, 198, 283, 198)
        pdf.setFontSize(8)
        pdf.setTextColor(100, 116, 139)
        pdf.text("Smart Biogas Monitoring - Ringkasan data mentah", 14, 204)
        pdf.text(`Halaman ${page} dari ${pageCount}`, 283, 204, { align: "right" })
      }

      const date = new Date().toISOString().slice(0, 10)
      pdf.save(`biogas-${deviceId}-ringkasan-${date}.pdf`)
      toast.success(`PDF summary dari ${history.length.toLocaleString("id-ID")} data berhasil dibuat.`)
    } catch (error) {
      console.error("Gagal export PDF:", error)
      toast.error("Export PDF gagal. Periksa koneksi dan coba kembali.")
    } finally {
      setExporting(null)
      setLoadedCount(0)
    }
  }

  const loadingLabel = loadedCount > 0
    ? `Memuat ${loadedCount.toLocaleString("id-ID")}...`
    : "Menyiapkan..."

  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ""}`}>
      <Button type="button" onClick={exportToExcel} disabled={!deviceId || exporting !== null} variant={variant} size={size}>
        {exporting === "excel" ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <FileSpreadsheet className="mr-2 h-4 w-4" />}
        {exporting === "excel" ? loadingLabel : "Export Excel"}
      </Button>
      <Button type="button" onClick={exportToPdf} disabled={!deviceId || exporting !== null} variant="outline" size={size}>
        {exporting === "pdf" ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
        {exporting === "pdf" ? loadingLabel : "Export PDF"}
      </Button>
    </div>
  )
}
