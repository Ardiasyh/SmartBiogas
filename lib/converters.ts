export type FlowUnit = "m3h" | "lmin";
export type PowerUnit = "kw" | "w";
export type PressureUnit = "pa" | "kpa" | "bar";


// ================= FLOW =================

export function convertFlow(value: number, unit: FlowUnit) {
  if (unit === "lmin") return (value * 1000) / 60; // m3/h → L/min
  return value; // default m3/h
}

export function flowLabel(unit: FlowUnit) {
  return unit === "lmin" ? "L/menit" : "m³/jam";
}


// ================= POWER =================

export function convertPower(value: number, unit: PowerUnit) {
  if (unit === "w") return value * 1000; // kW → W
  return value;
}

export function powerLabel(unit: PowerUnit) {
  return unit === "w" ? "W" : "kW";
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
