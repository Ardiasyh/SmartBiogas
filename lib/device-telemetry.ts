import { onValue, ref } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { preferredTelemetry, type Telemetry } from "@/lib/telemetry";

/**
 * Mendengarkan data sensor terbaru dari node realtime.
 *
 * Struktur RTDB yang dipakai:
 * biogasData/{deviceId}/realtime
 *
 * History sengaja tidak dipakai sebagai fallback di sini karena
 * biogasData/{deviceId}/logs adalah node terpisah untuk histori.
 */
export function watchDeviceTelemetry(
  deviceId: string,
  onTelemetry: (value: Telemetry | null) => void,
) {
  const realtimeRef = ref(rtdb, `biogasData/${deviceId}/realtime`);

  return onValue(
    realtimeRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onTelemetry(null);
        return;
      }

      onTelemetry(preferredTelemetry(snapshot.val(), null));
    },
    (error) => {
      console.error(`[RTDB] Gagal membaca realtime device ${deviceId}:`, error);
      onTelemetry(null);
    },
  );
}
