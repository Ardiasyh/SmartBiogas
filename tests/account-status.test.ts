import { describe, expect, it } from "vitest";
import { accountAccess, firebaseClaims } from "../lib/account-status";

describe("accountAccess", () => {
  it("normalizes legacy status values and only permits active accounts", () => {
    expect(accountAccess({ role: "user", status: "Pending", profileCompleted: true }))
      .toEqual({ role: "user", status: "pending", profileCompleted: true, allowed: false });
    expect(accountAccess({ role: "admin", status: "ACTIVE", profileCompleted: true }))
      .toEqual({ role: "admin", status: "active", profileCompleted: true, allowed: true });
  });

  it("keeps incomplete accounts blocked without treating them as invalid", () => {
    expect(accountAccess({ role: "admin", status: "active", profileCompleted: false }))
      .toEqual({ role: "admin", status: "active", profileCompleted: false, allowed: false });
  });

  it("rejects unknown account data", () => {
    expect(accountAccess({ role: "owner", status: "active", profileCompleted: true }))
      .toBeNull();
  });

  it("derives Firebase claims only from a validated profile", () => {
    const access = accountAccess({ role: "user", status: "active", profileCompleted: true });
    expect(firebaseClaims(access, { deviceId: "esp32-01" }))
      .toEqual({ role: "user", deviceId: "esp32-01" });
    expect(firebaseClaims(access, {})).toEqual({ role: "user" });
  });
});
