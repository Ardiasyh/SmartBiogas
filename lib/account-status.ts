export type AccountRole = "admin" | "user";
export type AccountStatus = "active" | "pending" | "disabled";

export type AccountAccess = {
  role: AccountRole;
  status: AccountStatus;
  profileCompleted: boolean;
  allowed: boolean;
};

export function accountAccess(value: unknown): AccountAccess | null {
  if (!value || typeof value !== "object") return null;

  const account = value as Record<string, unknown>;
  const role = account.role;
  const rawStatus = account.status;

  if ((role !== "admin" && role !== "user") || typeof rawStatus !== "string") {
    return null;
  }

  const status = rawStatus.toLowerCase() as AccountStatus;
  if (status !== "active" && status !== "pending" && status !== "disabled") {
    return null;
  }

  const profileCompleted = account.profileCompleted === true;
  return { role, status, profileCompleted, allowed: status === "active" && profileCompleted };
}

export function firebaseClaims(access: AccountAccess | null, profile: Record<string, unknown>) {
  if (!access) throw new Error("Invalid account access");

  const deviceId = typeof profile.deviceId === "string" ? profile.deviceId : undefined;
  return { role: access.role, ...(deviceId ? { deviceId } : {}) };
}
