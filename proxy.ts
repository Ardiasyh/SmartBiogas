// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(req: NextRequest) {
  const uid = req.cookies.get("uid")?.value
  const role = req.cookies.get("role")?.value
  const status = req.cookies.get("status")?.value
  const profileCompleted =
    req.cookies.get("profileCompleted")?.value === "true"

  const { pathname } = req.nextUrl

  // =====================
  // PUBLIC ROUTES
  // =====================
  if (
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/verify-email")
  ) {
    return NextResponse.next()
  }

  // =====================
  // NOT LOGGED IN
  // =====================
  if (!uid) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // =====================
  // PROFILE NOT COMPLETE
  // =====================
  if (!profileCompleted) {
    if (!pathname.startsWith("/signup/complete-profile")) {
      return NextResponse.redirect(
        new URL("/signup/complete-profile", req.url)
      )
    }
    return NextResponse.next()
  }

  // =====================
  // STATUS PENDING
  // =====================
  if (status === "Pending") {
    if (!pathname.startsWith("/pending")) {
      return NextResponse.redirect(new URL("/pending", req.url))
    }
    return NextResponse.next()
  }

  // =====================
  // ROLE GUARD (ADMIN)
  // =====================
  if (pathname.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(
      new URL("/users/dashboard", req.url)
    )
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/users/:path*",
    "/pending",
    "/signup/complete-profile",
  ],
}
