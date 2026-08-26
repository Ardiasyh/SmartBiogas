"use client"

import {
  Gauge,
  Thermometer,
  Wind,
  Zap,
  type LucideIcon,
} from "lucide-react"

import {
  convertFlow,
  flowLabel,
  convertEnergy,
  energyLabel,
  convertPressure,
  pressureLabel,
  type FlowUnit,
  type EnergyUnit,
  type PressureUnit,
} from "@/lib/converters"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Props = {
  flowRate: number
  pressure: number
  temperature: number
  totalUsage: number
  energy: number
  flowUnit: FlowUnit
  pressureUnit: PressureUnit
  energyUnit: EnergyUnit
  onChangeFlowUnit: (u: FlowUnit) => void
  onChangePressureUnit: (u: PressureUnit) => void
  onChangeEnergyUnit: (u: EnergyUnit) => void
}

export default function UserBiogasCard({
  flowRate,
  pressure,
  temperature,
  energy,
  flowUnit,
  pressureUnit,
  energyUnit,
  onChangeFlowUnit,
  onChangePressureUnit,
  onChangeEnergyUnit,
}: Props) {
  const flowValue = convertFlow(flowRate, flowUnit)
  const pressureValue = convertPressure(pressure, pressureUnit)
  const energyValue = convertEnergy(energy, energyUnit)

  const safeFlow = Number.isFinite(flowValue) ? flowValue : 0
  const safePressure = Number.isFinite(pressureValue) ? pressureValue : 0
  const safeTemperature = Number.isFinite(temperature) ? temperature : 0
  const safeEnergy = Number.isFinite(energyValue) ? energyValue : 0

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Badge variant="secondary">Live telemetry</Badge>
          <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
            Kondisi perangkat saat ini
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Nilai terbaru yang diterima dari Firebase Realtime Database.
          </p>
        </div>
        <Badge variant="outline" className="w-fit">Update otomatis</Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Flow Rate"
          description="Laju aliran biogas"
          value={safeFlow.toFixed(3)}
          unit={flowLabel(flowUnit)}
          icon={Wind}
          iconClassName="text-sky-600 dark:text-sky-400"
          control={
            <MetricSelect
              value={flowUnit}
              onChange={(value) => onChangeFlowUnit(value as FlowUnit)}
              options={[
                ["m3h", "m³/jam"],
                ["lmin", "L/menit"],
              ]}
            />
          }
        />

        <MetricCard
          title="Pressure"
          description="Tekanan gas pada digester"
          value={safePressure.toFixed(3)}
          unit={pressureLabel(pressureUnit)}
          icon={Gauge}
          iconClassName="text-amber-600 dark:text-amber-400"
          control={
            <MetricSelect
              value={pressureUnit}
              onChange={(value) => onChangePressureUnit(value as PressureUnit)}
              options={[
                ["pa", "Pa"],
                ["kpa", "kPa"],
                ["bar", "bar"],
              ]}
            />
          }
        />

        <MetricCard
          title="Temperature"
          description="Suhu gas terukur"
          value={safeTemperature.toFixed(1)}
          unit="°C"
          icon={Thermometer}
          iconClassName="text-rose-600 dark:text-rose-400"
        />

        <MetricCard
          title="Energy"
          description="Energi biogas terukur"
          value={safeEnergy.toFixed(3)}
          unit={energyLabel(energyUnit)}
          icon={Zap}
          iconClassName="text-violet-600 dark:text-violet-400"
          control={
            <MetricSelect
              value={energyUnit}
              onChange={(value) => onChangeEnergyUnit(value as EnergyUnit)}
              options={[
                ["kwh", "kWh"],
                ["mj", "MJ"],
              ]}
            />
          }
        />
      </div>
    </section>
  )
}

function MetricCard({
  title,
  description,
  value,
  unit,
  icon: Icon,
  iconClassName,
  control,
}: {
  title: string
  description: string
  value: string
  unit: string
  icon: LucideIcon
  iconClassName: string
  control?: React.ReactNode
}) {
  return (
    <Card className="shadow-sm transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border bg-muted/50">
            <Icon className={`h-4 w-4 ${iconClassName}`} />
          </span>
          {control}
        </div>
        <div className="pt-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <CardDescription className="mt-1 text-xs">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight">{value}</span>
          <span className="text-xs font-medium text-muted-foreground">{unit}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function MetricSelect({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: Array<[string, string]>
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground shadow-xs outline-none transition focus:border-ring focus:ring-[3px] focus:ring-ring/50"
      aria-label="Pilih satuan"
    >
      {options.map(([optionValue, label]) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  )
}
