export function formatTimestamp(ts: number) {
  return new Date(ts).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}
