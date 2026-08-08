import { endAt, get, limitToLast, orderByChild, query, ref } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { preferredTelemetry, type Telemetry } from "@/lib/telemetry";
import type { HistoryCursor } from "@/lib/history-pagination";

export type HistoryPoint = Telemetry & HistoryCursor;

export async function getHistoryPage(deviceId: string, cursor?: HistoryCursor, pageSize = 100) {
  const logs = ref(rtdb, `biogasData/${deviceId}/logs`);
  const logsQuery = cursor
    ? query(logs, orderByChild("timestamp"), endAt(cursor.timestamp, cursor.key), limitToLast(pageSize + 1))
    : query(logs, orderByChild("timestamp"), limitToLast(pageSize));
  const snapshot = await get(logsQuery);
  const page: HistoryPoint[] = [];

  snapshot.forEach((child) => {
    const telemetry = preferredTelemetry(null, child.val());
    if (telemetry && child.key) page.push({ ...telemetry, key: child.key });
  });

  return page.filter((item) => item.key !== cursor?.key).sort((a, b) => a.timestamp - b.timestamp || a.key.localeCompare(b.key));
}
