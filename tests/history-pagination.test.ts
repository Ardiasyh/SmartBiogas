import { describe, expect, it } from "vitest";
import { hasHistoryRange, historyMode, mergeHistoryPage, toHistoryRange } from "../lib/history-pagination";

describe("mergeHistoryPage", () => {
  it("keeps history ordered without duplicating the cursor item", () => {
    expect(mergeHistoryPage(
      [{ key: "b", timestamp: 200 }, { key: "c", timestamp: 300 }],
      [{ key: "a", timestamp: 100 }, { key: "b", timestamp: 200 }],
    )).toEqual([
      { key: "a", timestamp: 100 },
      { key: "b", timestamp: 200 },
      { key: "c", timestamp: 300 },
    ]);
  });
});

describe("toHistoryRange", () => {
  it("includes the entire selected end date", () => {
    const range = toHistoryRange("2026-08-08", "2026-08-08");

    if (!range?.from || !range.to) throw new Error("Expected a complete range");
    expect(range?.to - range?.from).toBe(86_399_999);
  });

  it("rejects an inverted date range", () => {
    expect(toHistoryRange("2026-08-09", "2026-08-08")).toBeNull();
  });

  it("distinguishes an applied range from the default realtime mode", () => {
    expect(hasHistoryRange({})).toBe(false);
    expect(hasHistoryRange({ from: 1 })).toBe(true);
    expect(historyMode({})).toBe("live");
    expect(historyMode({ from: 1 })).toBe("range");
  });
});
