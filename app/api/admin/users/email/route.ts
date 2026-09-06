import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { SESSION_COOKIE, sessionAccount } from "@/lib/server-session"

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export async function PATCH(request: Request) {
  try {
    const session = (await cookies()).get(SESSION_COOKIE)?.value
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const requester = await sessionAccount(session)
    if (!requester || requester.access.role !== "admin" || !requester.access.allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = (await request.json()) as { uid?: string; email?: string }
    const uid = body.uid?.trim() ?? ""
    const email = body.email?.trim() ?? ""

    if (!uid || !validEmail(email)) {
      return NextResponse.json({ error: "UID atau format email tidak valid." }, { status: 400 })
    }

    const auth = adminAuth()
    const db = adminDb()
    const userRef = db.collection("users").doc(uid)
    const [authUser, profileSnap] = await Promise.all([
      auth.getUser(uid),
      userRef.get(),
    ])

    if (!profileSnap.exists) {
      return NextResponse.json({ error: "Profil pengguna tidak ditemukan." }, { status: 404 })
    }

    const previousEmail = authUser.email ?? ""
    const previousVerified = authUser.emailVerified

    if (previousEmail === email) {
      if (profileSnap.data()?.email !== email) {
        await userRef.update({ email })
      }

      return NextResponse.json({
        email,
        emailVerified: previousVerified,
        changed: false,
      })
    }

    await auth.updateUser(uid, {
      email,
      emailVerified: false,
    })

    try {
      await userRef.update({ email })
    } catch (error) {
      if (previousEmail) {
        await auth.updateUser(uid, {
          email: previousEmail,
          emailVerified: previousVerified,
        })
      }
      throw error
    }

    return NextResponse.json({
      email,
      emailVerified: false,
      changed: true,
    })
  } catch (error: unknown) {
    const code =
      typeof error === "object" && error && "code" in error
        ? String((error as { code?: unknown }).code)
        : ""

    if (code.includes("email-already-exists")) {
      return NextResponse.json(
        { error: "Email tersebut sudah digunakan oleh akun lain." },
        { status: 409 },
      )
    }

    if (code.includes("user-not-found")) {
      return NextResponse.json({ error: "Akun Firebase tidak ditemukan." }, { status: 404 })
    }

    console.error("Gagal mengubah email pengguna:", error)
    return NextResponse.json(
      { error: "Gagal mengubah email pengguna." },
      { status: 500 },
    )
  }
}
