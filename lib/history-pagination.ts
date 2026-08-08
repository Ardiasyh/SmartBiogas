export type HistoryCursor = { key: string; timestamp: number };

export function mergeHistoryPage<T extends HistoryCursor>(current: T[], older: T[]) {
  return [...new Map([...current, ...older].map((item) => [item.key, item])).values()]
    .sort((a, b) => a.timestamp - b.timestamp || a.key.localeCompare(b.key));
}
