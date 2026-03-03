import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(req: Request) {
  const body = await req.json()

  const {
    uid,
    role,
    status,
    profileCompleted,
  } = body

  const cookieStore = cookies()

  ;(await cookieStore).set("uid", uid, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })

  ;(await cookieStore).set("role", role, {
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })

  ;(await cookieStore).set("status", status.toLowerCase(), {
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })

  ;(await cookieStore).set("profileCompleted", String(profileCompleted), {
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  })

  return NextResponse.json({ success: true })
}
