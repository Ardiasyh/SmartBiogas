export type FlowUnit = "m3h" | "lmin";
export type EnergyUnit = "kwh" | "mj";
export type PressureUnit = "pa" | "kpa" | "bar";


// ================= FLOW =================

export function convertFlow(value: number, unit: FlowUnit) {
  if (unit === "lmin") return (value * 1000) / 60; // m3/h → L/min
  return value; // default m3/h
}

export function flowLabel(unit: FlowUnit) {
  return unit === "lmin" ? "L/menit" : "m³/jam";
}


// ================= ENERGY =================

export function convertEnergy(value: number, unit: EnergyUnit) {
  if (unit === "mj") return value * 3.6; // kWh → MJ
  return value; // default kWh
}

export function energyLabel(unit: EnergyUnit) {
  return unit === "mj" ? "MJ" : "kWh";
}


// ================= PRESSURE =================

export function convertPressure(
  value: number,
  unit: PressureUnit
) {
  switch (unit) {
    case "kpa":
      return value / 1000; // Pa → kPa
    case "bar":
      return value / 100000; // Pa → bar
    default:
      return value; // default Pa
  }
}

export function pressureLabel(unit: PressureUnit) {
  switch (unit) {
    case "kpa":
      return "kPa";
    case "bar":
      return "bar";
    default:
      return "Pa";
  }
}
