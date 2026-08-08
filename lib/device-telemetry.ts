import { limitToLast, onValue, query, ref } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { preferredTelemetry, type Telemetry } from "@/lib/telemetry";

export function watchDeviceTelemetry(deviceId: string, onTelemetry: (value: Telemetry | null) => void) {
  let stopLegacy: (() => void) | undefined;

  const startLegacy = () => {
    if (stopLegacy) return;
    stopLegacy = onValue(
      query(ref(rtdb, `biogasData/${deviceId}/logs`), limitToLast(1)),
      (snapshot) => {
        let latest: unknown = null;
        snapshot.forEach((child) => {
          latest = child.val();
        });
        onTelemetry(preferredTelemetry(null, latest));
      },
    );
  };

  const stopRealtime = onValue(ref(rtdb, `biogasData/${deviceId}/realtime`), (snapshot) => {
    const current = preferredTelemetry(snapshot.val(), null);
    if (!current) return startLegacy();

    stopLegacy?.();
    stopLegacy = undefined;
    onTelemetry(current);
  });

  return () => {
    stopRealtime();
    stopLegacy?.();
  };
}
