"use client"

import { createContext, useContext, useState } from "react"
import { FlowUnit, PowerUnit } from "@/lib/unitConfig"

type UnitContextType = {
  flowUnit: FlowUnit
  powerUnit: PowerUnit
  setFlowUnit: (u: FlowUnit) => void
  setPowerUnit: (u: PowerUnit) => void
}

const UnitContext = createContext<UnitContextType | null>(null)

export function UnitProvider({ children }: { children: React.ReactNode }) {
  const [flowUnit, setFlowUnit] = useState<FlowUnit>("m3h")
  const [powerUnit, setPowerUnit] = useState<PowerUnit>("kw")

  return (
    <UnitContext.Provider
      value={{ flowUnit, powerUnit, setFlowUnit, setPowerUnit }}
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
