import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { SESSION_COOKIE, sessionAccount } from "@/lib/server-session"

function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

type UpdateUserBody = {
  uid?: string
  fullname?: string
  email?: string
  activate?: boolean
  deviceId?: string
  locationName?: string
  lat?: number | null
  lng?: number | null
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

    const body = (await request.json()) as UpdateUserBody
    const uid = body.uid?.trim() ?? ""
    const fullname = body.fullname?.trim() ?? ""
    const email = body.email?.trim() ?? ""
    const deviceId = body.deviceId?.trim() ?? ""
    const locationName = body.locationName?.trim() ?? ""
    const lat = typeof body.lat === "number" && Number.isFinite(body.lat) ? body.lat : null
    const lng = typeof body.lng === "number" && Number.isFinite(body.lng) ? body.lng : null
    const activate = body.activate === true
    const installationComplete = Boolean(deviceId) && lat !== null && lng !== null

    if (!uid || !fullname || !validEmail(email)) {
      return NextResponse.json(
        { error: "Nama, email, atau UID pengguna tidak valid." },
        { status: 400 },
      )
    }

    if (activate && !installationComplete) {
      return NextResponse.json(
        { error: "Device ID dan titik lokasi harus lengkap sebelum akun diaktifkan." },
        { status: 400 },
      )
    }

    const auth = adminAuth()
    const db = adminDb()
    const userRef = db.collection("users").doc(uid)
    const [authUser, profileSnap] = await Promise.all([auth.getUser(uid), userRef.get()])

    if (!profileSnap.exists) {
      return NextResponse.json({ error: "Profil pengguna tidak ditemukan." }, { status: 404 })
    }

    const profile = profileSnap.data() as Record<string, unknown>
    if (profile.role !== "user") {
      return NextResponse.json(
        { error: "Endpoint ini hanya digunakan untuk akun user." },
        { status: 400 },
      )
    }

    const previousEmail = authUser.email ?? ""
    const previousVerified = authUser.emailVerified
    const emailChanged = previousEmail !== email

    if (emailChanged) {
      await auth.updateUser(uid, {
        email,
        emailVerified: false,
      })
    }

    const updates: Record<string, string | number> = {
      fullname,
      email,
    }

    if (installationComplete) {
      updates.deviceId = deviceId
      updates.locationName = locationName
      updates.lat = lat
      updates.lng = lng
    }

    if (activate) updates.status = "active"

    try {
      await userRef.update(updates)
    } catch (error) {
      if (emailChanged && previousEmail) {
        await auth.updateUser(uid, {
          email: previousEmail,
          emailVerified: previousVerified,
        })
      }
      throw error
    }

    return NextResponse.json({
      user: {
        id: uid,
        ...profile,
        ...updates,
      },
      emailChanged,
      emailVerified: emailChanged ? false : authUser.emailVerified,
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

    console.error("Gagal memperbarui user:", error)
    return NextResponse.json(
      { error: "Gagal memperbarui data pengguna." },
      { status: 500 },
    )
  }
}
