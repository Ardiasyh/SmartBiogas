export type HistoryCursor = { key: string; timestamp: number };
export type HistoryRange = { from?: number; to?: number };

export function hasHistoryRange(range: HistoryRange) {
  return range.from !== undefined || range.to !== undefined;
}

export function historyMode(range: HistoryRange) {
  return hasHistoryRange(range) ? "range" : "live";
}

export function toHistoryRange(fromDate: string, toDate: string): HistoryRange | null {
  const from = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : undefined;
  const to = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : undefined;
  if ((fromDate && !Number.isFinite(from)) || (toDate && !Number.isFinite(to)) || (from !== undefined && to !== undefined && from > to)) return null;
  return { ...(from !== undefined ? { from } : {}), ...(to !== undefined ? { to } : {}) };
}

export function mergeHistoryPage<T extends HistoryCursor>(current: T[], older: T[]) {
  return [...new Map([...current, ...older].map((item) => [item.key, item])).values()]
    .sort((a, b) => a.timestamp - b.timestamp || a.key.localeCompare(b.key));
}
