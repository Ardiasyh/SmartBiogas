export type Telemetry = {
  timestamp: number;
  /** Firmware currently stores instantaneous power (kW) in the RTDB `energy` key. */
  powerKw: number;
  flowrate: number;
  pressure: number;
  temperature: number;
  massKgph?: number;
  status?: string;
};

export const DEVICE_OFFLINE_TIMEOUT_MS = 30_000;

type TelemetryRecord = Record<string, unknown>;

function numberValue(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function timestampValue(value: unknown) {
  const numeric = numberValue(value);
  return numeric || (typeof value === "string" ? Date.parse(value) || 0 : 0);
}

function telemetry(value: unknown): Telemetry | null {
  if (!value || typeof value !== "object") return null;

  const record = value as TelemetryRecord;
  const timestamp = timestampValue(record.timestamp);
  if (!timestamp) return null;

  const explicitPowerKw = record.power_kW ?? record.powerKw;
  const explicitPowerW = record.power_W;
  const powerKw = explicitPowerKw !== undefined
    ? numberValue(explicitPowerKw)
    : explicitPowerW !== undefined
      ? numberValue(explicitPowerW) / 1000
      : numberValue(record.energy);
  const massValue = record.mass_kgph ?? record.mass;

  return {
    timestamp,
    powerKw,
    flowrate: numberValue(record.flowrate),
    pressure: numberValue(record.pressure),
    temperature: numberValue(record.temperature),
    ...(massValue !== undefined ? { massKgph: numberValue(massValue) } : {}),
    ...(typeof record.status === "string" ? { status: record.status } : {}),
  };
}

export function preferredTelemetry(realtime: unknown, legacyLog: unknown) {
  return telemetry(realtime) ?? telemetry(legacyLog);
}

export function deviceStatus(value: Telemetry | null, now = Date.now(), timeout = DEVICE_OFFLINE_TIMEOUT_MS) {
  if (!value) return "UNKNOWN" as const;
  return now - value.timestamp <= timeout ? "ONLINE" as const : "OFFLINE" as const;
}
