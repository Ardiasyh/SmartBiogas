import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE, sessionAccount } from "@/lib/server-session"

export async function proxy(req: NextRequest) {
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
  const session = req.cookies.get(SESSION_COOKIE)?.value
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  let account
  try {
    account = await sessionAccount(session)
  } catch {
    const response = NextResponse.redirect(new URL("/login", req.url))
    response.cookies.delete(SESSION_COOKIE)
    return response
  }
  if (!account) return NextResponse.redirect(new URL("/login", req.url))

  // =====================
  // PROFILE NOT COMPLETE
  // =====================
  if (!account.access.profileCompleted) {
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
  if (account.access.status !== "active") {
    if (!pathname.startsWith("/pending")) {
      return NextResponse.redirect(new URL("/pending", req.url))
    }
    return NextResponse.next()
  }

  // =====================
  // ROLE GUARD (ADMIN)
  // =====================
  if (pathname.startsWith("/admin") && account.access.role !== "admin") {
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
