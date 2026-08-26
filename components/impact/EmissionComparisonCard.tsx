"use client"

import { Leaf, Scale, ShieldCheck } from "lucide-react"

import {
  calculateLpgComparisonFromFlow,
  LPG_CO2_KG_PER_KG,
  LPG_LHV_KWH_PER_KG,
} from "@/lib/emissions"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Props = {
  flowRateM3h: number
  title?: string
  description?: string
  scopeLabel?: string
}

export default function EmissionComparisonCard({
  flowRateM3h,
  title = "Perbandingan dengan LPG",
  description = "Estimasi LPG ekuivalen dan emisi CO₂ fosil yang dapat dihindari berdasarkan flowrate biogas realtime.",
  scopeLabel = "Realtime estimate",
}: Props) {
  const impact = calculateLpgComparisonFromFlow(flowRateM3h)

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <CardTitle className="text-base">{title}</CardTitle>
              <Badge variant="secondary" className="gap-1.5 font-normal">
                <Leaf className="h-3 w-3" /> {scopeLabel}
              </Badge>
            </div>
            <CardDescription className="max-w-2xl">{description}</CardDescription>
          </div>

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border bg-background text-primary">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <ImpactStat
            label="Flowrate biogas"
            value={impact.biogasFlowM3h.toFixed(3)}
            unit="m³/h"
            helper="Data realtime yang menjadi dasar estimasi"
          />
          <ImpactStat
            label="LPG ekuivalen"
            value={impact.lpgEquivalentKgPerHour.toFixed(3)}
            unit="kg/h"
            helper="Jumlah LPG dengan energi setara"
            emphasized
          />
          <ImpactStat
            label="CO₂ fosil dihindari"
            value={impact.avoidedCo2KgPerHour.toFixed(3)}
            unit="kg CO₂/h"
            helper="Potensi emisi pembakaran LPG yang tergantikan"
          />
        </div>

        <div className="mt-5 grid gap-3 rounded-lg border bg-muted/20 p-4 text-xs text-muted-foreground lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-2">
            <Scale className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="leading-5">
              Perhitungan menggunakan LHV biogas 5,568 kWh/m³, NCV LPG {LPG_LHV_KWH_PER_KG.toFixed(3)} kWh/kg,
              dan faktor emisi pembakaran LPG {LPG_CO2_KG_PER_KG.toFixed(3)} kg CO₂/kg LPG.
            </p>
          </div>
          <Badge variant="outline" className="w-fit font-normal">Estimasi substitusi energi</Badge>
        </div>
      </CardContent>
    </Card>
  )
}

function ImpactStat({
  label,
  value,
  unit,
  helper,
  emphasized = false,
}: {
  label: string
  value: string
  unit: string
  helper: string
  emphasized?: boolean
}) {
  return (
    <div className={`rounded-lg border p-4 ${emphasized ? "bg-primary/[0.04]" : "bg-background"}`}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="mt-2 flex flex-wrap items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight tabular-nums">{value}</span>
        <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">{helper}</p>
    </div>
  )
}
