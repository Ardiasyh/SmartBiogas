export type FlowUnit = "m3h" | "lmin"
export type PowerUnit = "kw" | "w"

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

export const powerUnits = {
  kw: {
    label: "kW",
    factor: 1,
  },
  w: {
    label: "W",
    factor: 1000,
  },
}
