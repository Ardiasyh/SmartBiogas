import { describe, expect, it } from "vitest";
import { deviceStatus, preferredTelemetry } from "../lib/telemetry";

describe("preferredTelemetry", () => {
  it("uses realtime data before the legacy log", () => {
    expect(preferredTelemetry(
      { timestamp: 200, energy: 4, flowrate: 1 },
      { timestamp: 100, energy: 2, flowrate: 0.5 },
    )).toMatchObject({ timestamp: 200, energy: 4 });
  });

  it("falls back to the latest legacy log when realtime is absent", () => {
    expect(preferredTelemetry(null, { timestamp: 100, energy: 2 }))
      .toMatchObject({ timestamp: 100, energy: 2 });
  });

  it("accepts an ISO timestamp from legacy telemetry", () => {
    expect(preferredTelemetry(null, { timestamp: "2026-08-08T12:00:00.000Z", energy: 2 }))
      .toMatchObject({ timestamp: 1786190400000, energy: 2 });
  });

  it("marks stale telemetry offline", () => {
    expect(deviceStatus({ timestamp: 10_000, energy: 0, pressure: 0, temperature: 0, flowrate: 0 }, 25_001))
      .toBe("OFFLINE");
  });
});
