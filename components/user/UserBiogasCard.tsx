"use client"

import { motion } from "framer-motion"
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
    <section>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
            Live telemetry
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
            Kondisi perangkat saat ini
          </h2>
        </div>
        <div className="hidden rounded-full border border-border/70 bg-card/70 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur sm:block">
          Update otomatis dari Firebase
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          index={0}
          title="Flow Rate"
          value={safeFlow.toFixed(3)}
          unit={flowLabel(flowUnit)}
          helper="Laju aliran biogas"
          icon={Wind}
          iconClassName="bg-sky-500/12 text-sky-600 dark:text-sky-400"
          glowClassName="bg-sky-400/10"
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
          index={1}
          title="Pressure"
          value={safePressure.toFixed(3)}
          unit={pressureLabel(pressureUnit)}
          helper="Tekanan gas pada digester"
          icon={Gauge}
          iconClassName="bg-amber-500/12 text-amber-600 dark:text-amber-400"
          glowClassName="bg-amber-400/10"
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
          index={2}
          title="Temperature"
          value={safeTemperature.toFixed(1)}
          unit="°C"
          helper="Suhu gas terukur"
          icon={Thermometer}
          iconClassName="bg-rose-500/12 text-rose-600 dark:text-rose-400"
          glowClassName="bg-rose-400/10"
        />

        <MetricCard
          index={3}
          title="Energy"
          value={safeEnergy.toFixed(3)}
          unit={energyLabel(energyUnit)}
          helper="Energi biogas terukur"
          icon={Zap}
          iconClassName="bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
          glowClassName="bg-emerald-400/10"
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
  index,
  title,
  value,
  unit,
  helper,
  icon: Icon,
  iconClassName,
  glowClassName,
  control,
}: {
  index: number
  title: string
  value: string
  unit: string
  helper: string
  icon: LucideIcon
  iconClassName: string
  glowClassName: string
  control?: React.ReactNode
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06 }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/75 p-5 shadow-[0_16px_50px_-32px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-shadow duration-300 hover:shadow-[0_22px_65px_-32px_rgba(0,0,0,0.5)]"
    >
      <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-2xl ${glowClassName}`} />

      <div className="relative flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClassName}`}>
          <Icon className="h-5 w-5" />
        </div>
        {control}
      </div>

      <div className="relative mt-6">
        <p className="text-sm font-semibold text-muted-foreground">{title}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <motion.span
            key={value}
            initial={{ opacity: 0.5, y: 3 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-black tracking-tight sm:text-[2rem]"
          >
            {value}
          </motion.span>
          <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            {unit}
          </span>
        </div>
        <p className="mt-3 text-xs leading-5 text-muted-foreground/80">{helper}</p>
      </div>
    </motion.article>
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
      className="max-w-[110px] rounded-xl border border-border/70 bg-background/70 px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
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
