import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, sessionAccount } from "@/lib/server-session";

export async function GET() {
  try {
    const session = (await cookies()).get(SESSION_COOKIE)?.value;
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const account = await sessionAccount(session);
    if (!account) return NextResponse.json({ error: "Not Found" }, { status: 404 });
    return NextResponse.json({ ...account.profile, access: account.access });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
