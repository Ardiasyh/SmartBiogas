import {
  endAt,
  get,
  limitToLast,
  onValue,
  orderByChild,
  query,
  ref,
  startAt,
  type DataSnapshot,
} from "firebase/database"

import { rtdb } from "@/lib/firebase"
import { preferredTelemetry, type Telemetry } from "@/lib/telemetry"
import type { HistoryCursor, HistoryRange } from "@/lib/history-pagination"

export type HistoryPoint = Telemetry & HistoryCursor

type GetAllHistoryOptions = {
  range?: HistoryRange
  pageSize?: number
  onProgress?: (loaded: number) => void
}

function historyPoints(snapshot: DataSnapshot, cursor?: HistoryCursor) {
  const page: HistoryPoint[] = []

  snapshot.forEach((child) => {
    const telemetry = preferredTelemetry(null, child.val())
    if (telemetry && child.key) page.push({ ...telemetry, key: child.key })
  })

  return page
    .filter((item) => item.key !== cursor?.key)
    .sort((a, b) => a.timestamp - b.timestamp || a.key.localeCompare(b.key))
}

export function watchRecentHistory(
  deviceId: string,
  onHistory: (history: HistoryPoint[]) => void,
  onError: (error: Error) => void,
  pageSize = 100,
) {
  return onValue(
    query(
      ref(rtdb, `biogasData/${deviceId}/logs`),
      orderByChild("timestamp"),
      limitToLast(pageSize),
    ),
    (snapshot) => onHistory(historyPoints(snapshot)),
    onError,
  )
}

export async function getHistoryRange(deviceId: string, range: HistoryRange) {
  const logs = ref(rtdb, `biogasData/${deviceId}/logs`)

  if (range.from === undefined && range.to === undefined) {
    return historyPoints(await get(query(logs, orderByChild("timestamp"))))
  }

  const logsQuery =
    range.from !== undefined && range.to !== undefined
      ? query(logs, orderByChild("timestamp"), startAt(range.from), endAt(range.to))
      : range.from !== undefined
        ? query(logs, orderByChild("timestamp"), startAt(range.from))
        : query(logs, orderByChild("timestamp"), endAt(range.to!))

  return historyPoints(await get(logsQuery))
}

export async function getHistoryPage(
  deviceId: string,
  cursor?: HistoryCursor,
  pageSize = 100,
  range?: HistoryRange,
) {
  const logs = ref(rtdb, `biogasData/${deviceId}/logs`)
  const logsQuery = cursor
    ? range?.from !== undefined
      ? query(
          logs,
          orderByChild("timestamp"),
          startAt(range.from),
          endAt(cursor.timestamp, cursor.key),
          limitToLast(pageSize + 1),
        )
      : query(
          logs,
          orderByChild("timestamp"),
          endAt(cursor.timestamp, cursor.key),
          limitToLast(pageSize + 1),
        )
    : range?.from !== undefined && range.to !== undefined
      ? query(
          logs,
          orderByChild("timestamp"),
          startAt(range.from),
          endAt(range.to),
          limitToLast(pageSize),
        )
      : range?.from !== undefined
        ? query(logs, orderByChild("timestamp"), startAt(range.from), limitToLast(pageSize))
        : range?.to !== undefined
          ? query(logs, orderByChild("timestamp"), endAt(range.to), limitToLast(pageSize))
          : query(logs, orderByChild("timestamp"), limitToLast(pageSize))

  return historyPoints(await get(logsQuery), cursor)
}

export async function getAllHistory(
  deviceId: string,
  options: GetAllHistoryOptions = {},
) {
  const pageSize = Math.max(100, Math.min(options.pageSize ?? 1000, 5000))
  const result: HistoryPoint[] = []
  const seenKeys = new Set<string>()
  let cursor: HistoryCursor | undefined

  while (true) {
    const page = await getHistoryPage(deviceId, cursor, pageSize, options.range)

    if (page.length === 0) break

    const uniquePage = page.filter((point) => {
      if (seenKeys.has(point.key)) return false
      seenKeys.add(point.key)
      return true
    })

    result.unshift(...uniquePage)
    options.onProgress?.(result.length)

    if (page.length < pageSize) break

    const nextCursor = page[0]
    if (!nextCursor || nextCursor.key === cursor?.key) break
    cursor = nextCursor
  }

  return result.sort(
    (a, b) => a.timestamp - b.timestamp || a.key.localeCompare(b.key),
  )
}
