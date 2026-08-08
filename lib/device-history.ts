import { endAt, get, limitToLast, orderByChild, query, ref, startAt } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { preferredTelemetry, type Telemetry } from "@/lib/telemetry";
import type { HistoryCursor, HistoryRange } from "@/lib/history-pagination";

export type HistoryPoint = Telemetry & HistoryCursor;

function historyPoints(snapshot: Awaited<ReturnType<typeof get>>, cursor?: HistoryCursor) {
  const page: HistoryPoint[] = [];

  snapshot.forEach((child) => {
    const telemetry = preferredTelemetry(null, child.val());
    if (telemetry && child.key) page.push({ ...telemetry, key: child.key });
  });

  return page.filter((item) => item.key !== cursor?.key).sort((a, b) => a.timestamp - b.timestamp || a.key.localeCompare(b.key));
}

export async function getHistoryRange(deviceId: string, range: HistoryRange) {
  // ponytail: range query is intentionally unpaged for chart/export; aggregate or cap it if users select long ranges.
  const logs = ref(rtdb, `biogasData/${deviceId}/logs`);
  const logsQuery = range.from !== undefined && range.to !== undefined
    ? query(logs, orderByChild("timestamp"), startAt(range.from), endAt(range.to))
    : range.from !== undefined
      ? query(logs, orderByChild("timestamp"), startAt(range.from))
      : query(logs, orderByChild("timestamp"), endAt(range.to!));
  return historyPoints(await get(logsQuery));
}

export async function getHistoryPage(deviceId: string, cursor?: HistoryCursor, pageSize = 100, range?: HistoryRange) {
  const logs = ref(rtdb, `biogasData/${deviceId}/logs`);
  const logsQuery = cursor
    ? range?.from !== undefined
      ? query(logs, orderByChild("timestamp"), startAt(range.from), endAt(cursor.timestamp, cursor.key), limitToLast(pageSize + 1))
      : query(logs, orderByChild("timestamp"), endAt(cursor.timestamp, cursor.key), limitToLast(pageSize + 1))
    : range?.from !== undefined && range.to !== undefined
      ? query(logs, orderByChild("timestamp"), startAt(range.from), endAt(range.to), limitToLast(pageSize))
      : range?.from !== undefined
        ? query(logs, orderByChild("timestamp"), startAt(range.from), limitToLast(pageSize))
        : range?.to !== undefined
          ? query(logs, orderByChild("timestamp"), endAt(range.to), limitToLast(pageSize))
          : query(logs, orderByChild("timestamp"), limitToLast(pageSize));
  return historyPoints(await get(logsQuery), cursor);
}
