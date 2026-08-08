import { accountAccess, firebaseClaims, type AccountAccess } from "@/lib/account-status";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export const SESSION_COOKIE = "session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export type SessionAccount = {
  uid: string;
  access: AccountAccess;
  profile: Record<string, unknown>;
};

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  return authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
}

async function accountForUid(uid: string): Promise<SessionAccount | null> {
  const snapshot = await adminDb().collection("users").doc(uid).get();
  if (!snapshot.exists) return null;

  const profile = snapshot.data() as Record<string, unknown>;
  const access = accountAccess(profile);
  return access ? { uid, access, profile } : null;
}

export async function createSession(request: Request) {
  const idToken = bearerToken(request);
  if (!idToken) return null;

  const decoded = await adminAuth().verifyIdToken(idToken);
  const account = await accountForUid(decoded.uid);
  if (!account) return null;

  await adminAuth().setCustomUserClaims(decoded.uid, firebaseClaims(account.access, account.profile));

  return {
    account,
    session: await adminAuth().createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE * 1000 }),
  };
}

export async function sessionAccount(session: string) {
  const decoded = await adminAuth().verifySessionCookie(session, true);
  return accountForUid(decoded.uid);
}
