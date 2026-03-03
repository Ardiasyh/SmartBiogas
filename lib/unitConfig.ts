export type FlowUnit = "m3h" | "lmin"
export type EnergyUnit = "kwh" | "mj"

export const flowUnits = {
  m3h: {
    label: "m³/jam",
    factor: 1,
  },
  lmin: {
    label: "L/menit",
    factor: 1000 / 60, // 1 m3/h → L/min
  },
}

export const energyUnits = {
  kwh: {
    label: "kWh",
    factor: 1,
  },
  mj: {
    label: "MJ",
    factor: 3.6,
  },
}
