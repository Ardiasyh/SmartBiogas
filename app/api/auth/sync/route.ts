import { NextResponse } from "next/server"
import { SESSION_COOKIE, createSession } from "@/lib/server-session"

export async function POST(req: Request) {
  try {
    const result = await createSession(req)
    if (!result) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const response = NextResponse.json({ access: result.account.access })
    response.cookies.set(SESSION_COOKIE, result.session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    })
    ;["uid", "role", "status", "profileCompleted"].forEach((name) => response.cookies.delete(name))
    return response
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}
