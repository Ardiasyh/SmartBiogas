"use client"

import { createContext, useContext, useState } from "react"
import { FlowUnit, EnergyUnit } from "@/lib/unitConfig"

type UnitContextType = {
  flowUnit: FlowUnit
  energyUnit: EnergyUnit
  setFlowUnit: (u: FlowUnit) => void
  setEnergyUnit: (u: EnergyUnit) => void
}

const UnitContext = createContext<UnitContextType | null>(null)

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [flowUnit, setFlowUnit] = useState<FlowUnit>("m3h")
  const [energyUnit, setEnergyUnit] = useState<EnergyUnit>("kwh")

  return (
    <UnitContext.Provider
      value={{ flowUnit, energyUnit, setFlowUnit, setEnergyUnit }}
    >
      {children}
    </UnitContext.Provider>
  )
}

export function useUnit() {
  const ctx = useContext(UnitContext)
  if (!ctx) throw new Error("useUnit harus di dalam UnitProvider")
  return ctx
}
