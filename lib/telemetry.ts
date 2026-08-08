export type Telemetry = {
  timestamp: number;
  energy: number;
  flowrate: number;
  pressure: number;
  temperature: number;
  status?: string;
};

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

  return {
    timestamp,
    energy: numberValue(record.energy),
    flowrate: numberValue(record.flowrate),
    pressure: numberValue(record.pressure),
    temperature: numberValue(record.temperature),
    ...(typeof record.status === "string" ? { status: record.status } : {}),
  };
}

export function preferredTelemetry(realtime: unknown, legacyLog: unknown) {
  return telemetry(realtime) ?? telemetry(legacyLog);
}

export function deviceStatus(value: Telemetry | null, now = Date.now(), timeout = 15_000) {
  if (!value) return "UNKNOWN" as const;
  return now - value.timestamp <= timeout ? "ONLINE" as const : "OFFLINE" as const;
}
