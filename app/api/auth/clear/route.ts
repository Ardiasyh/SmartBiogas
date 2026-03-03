
import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  const cookieStore = cookies()

  ;["uid", "role", "status", "profileCompleted"].forEach(async (k) =>
    (await cookieStore).delete(k)
  )

  return NextResponse.json({ ok: true })
}
