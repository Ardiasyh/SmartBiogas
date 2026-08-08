import { describe, expect, it } from "vitest";
import { mergeHistoryPage } from "../lib/history-pagination";

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
