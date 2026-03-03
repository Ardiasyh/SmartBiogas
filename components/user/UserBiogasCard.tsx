"use client"

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
  const safeFlow = typeof flowValue === "number" ? flowValue : 0


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

      {/* FLOW */}
      <div className="p-6 rounded-2xl border bg-white dark:bg-zinc-900">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Flow Rate</h2>

          <select
            value={flowUnit}
            onChange={(e) =>
              onChangeFlowUnit(e.target.value as FlowUnit)
            }
            className="text-sm border rounded px-2 py-1 bg-white dark:bg-zinc-800"
          >
            <option value="m3h">m³/jam</option>
            <option value="lmin">L/menit</option>
          </select>
        </div>

        <p className="text-2xl font-bold">
          {safeFlow.toFixed(3)} {flowLabel(flowUnit)}

        </p>
      </div>

      {/* PRESSURE */}
      <div className="p-6 rounded-2xl border bg-white dark:bg-zinc-900">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Pressure</h2>

          <select
            value={pressureUnit}
            onChange={(e) =>
              onChangePressureUnit(e.target.value as PressureUnit)
            }
            className="text-sm border rounded px-2 py-1 bg-white dark:bg-zinc-800"
          >
            <option value="pa">Pa</option>
            <option value="kpa">kPa</option>
            <option value="bar">bar</option>
          </select>
        </div>

        <p className="text-2xl font-bold">
          {pressureValue.toFixed(3)} {pressureLabel(pressureUnit)}
        </p>
      </div>

      {/* TEMPERATURE */}
      <div className="p-6 rounded-2xl border bg-white dark:bg-zinc-900">
        <h2 className="text-lg font-semibold mb-2">
          Temperature
        </h2>
        <p className="text-2xl font-bold">
          {temperature.toFixed(1)} °C
        </p>
      </div>

      {/* ENERGY */}
      <div className="p-6 rounded-2xl border bg-white dark:bg-zinc-900">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Energy</h2>

          <select
            value={energyUnit}
            onChange={(e) =>
              onChangeEnergyUnit(e.target.value as EnergyUnit)
            }
            className="text-sm border rounded px-2 py-1 bg-white dark:bg-zinc-800"
          >
            <option value="kwh">kWh</option>
            <option value="mj">MJ</option>
          </select>
        </div>

        <p className="text-2xl font-bold">
          {energyValue.toFixed(3)} {energyLabel(energyUnit)}
        </p>
      </div>

    </div>
  )
}
