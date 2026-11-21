import {
  endAt,
  get,
  limitToFirst,
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

type HistoryListener = (history: HistoryPoint[]) => void
type HistoryErrorListener = (error: Error) => void

type SharedHistorySubscription = {
  listeners: Set<HistoryListener>
  errorListeners: Set<HistoryErrorListener>
  latest?: HistoryPoint[]
  stop: () => void
}

const sharedHistorySubscriptions = new Map<string, SharedHistorySubscription>()

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

export function compactHistoryPoints(points: HistoryPoint[], maxPoints = 120) {
  if (points.length <= maxPoints) return points

  const bucketSize = Math.ceil(points.length / maxPoints)
  const compacted: HistoryPoint[] = []
  for (let index = 0; index < points.length; index += bucketSize) {
    const bucket = points.slice(index, index + bucketSize)
    const last = bucket.at(-1)!
    compacted.push({
      ...last,
      timestamp: Math.round(
        bucket.reduce((sum, point) => sum + point.timestamp, 0) / bucket.length,
      ),
      powerKw: bucket.reduce((sum, point) => sum + point.powerKw, 0) / bucket.length,
      flowrate: bucket.reduce((sum, point) => sum + point.flowrate, 0) / bucket.length,
      pressure: bucket.reduce((sum, point) => sum + point.pressure, 0) / bucket.length,
      temperature: bucket.reduce((sum, point) => sum + point.temperature, 0) / bucket.length,
      ...(bucket.some((point) => point.massKgph !== undefined)
        ? { massKgph: bucket.reduce((sum, point) => sum + (point.massKgph ?? 0), 0) / bucket.length }
        : {}),
    })
  }
  return compacted
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

export function watchHistoryFrom(
  deviceId: string,
  from: number,
  onHistory: (history: HistoryPoint[]) => void,
  onError: (error: Error) => void,
) {
  const key = `${deviceId}:${from}`
  let subscription = sharedHistorySubscriptions.get(key)

  if (!subscription) {
    subscription = {
      listeners: new Set(),
      errorListeners: new Set(),
      stop: () => undefined,
    }
    sharedHistorySubscriptions.set(key, subscription)

    const activeSubscription = subscription
    activeSubscription.stop = onValue(
      query(
        ref(rtdb, `biogasData/${deviceId}/logs`),
        orderByChild("timestamp"),
        startAt(from),
      ),
      (snapshot) => {
        const history = compactHistoryPoints(historyPoints(snapshot))
        activeSubscription.latest = history
        activeSubscription.listeners.forEach((listener) => listener(history))
      },
      (error) => {
        activeSubscription.errorListeners.forEach((listener) => listener(error))
      },
    )
  }

  subscription.listeners.add(onHistory)
  subscription.errorListeners.add(onError)
  if (subscription.latest) queueMicrotask(() => onHistory(subscription.latest!))

  return () => {
    subscription.listeners.delete(onHistory)
    subscription.errorListeners.delete(onError)
    if (subscription.listeners.size === 0) {
      subscription.stop()
      sharedHistorySubscriptions.delete(key)
    }
  }
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

export async function getHistoryBounds(deviceId: string) {
  const logs = ref(rtdb, `biogasData/${deviceId}/logs`)
  const [firstSnapshot, lastSnapshot] = await Promise.all([
    get(query(logs, orderByChild("timestamp"), limitToFirst(1))),
    get(query(logs, orderByChild("timestamp"), limitToLast(1))),
  ])
  const first = historyPoints(firstSnapshot)[0]
  const last = historyPoints(lastSnapshot)[0]

  return first && last
    ? { from: first.timestamp, to: last.timestamp }
    : null
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
