import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "default_rokad_secret_key_change_in_production_32chars"
);

const ADMIN_ONLY_PATHS = [
  "/dashboard",
  "/employees",
  "/reports",
  "/analytics",
  "/bot-guide",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static files and public endpoints pass through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/telegram") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/cron") ||
    pathname === "/api/health" ||
    pathname.startsWith("/auth/verify") ||
    pathname === "/login" ||
    pathname === "/login/member" ||
    pathname === "/admin-login" ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionToken = req.cookies.get("rokad_admin_session")?.value;

  // 1. Unauthenticated users handling
  if (!sessionToken) {
    // Return JSON 401 for API routes rather than HTML redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If trying to access admin dashboard or reports, go to admin login
    const isAdminRoute = ADMIN_ONLY_PATHS.some(
      (p) => pathname === p || pathname.startsWith(`${p}/`)
    );

    if (isAdminRoute) {
      return NextResponse.redirect(new URL("/admin-login", req.url));
    }

    // Default for all members/public
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 2. Authenticated users handling
  try {
    const { payload } = await jwtVerify(sessionToken, JWT_SECRET, {
      algorithms: ["HS256"],
    });

    const userRole = payload.role as string;

    // Strict Role Enforcement:
    // If role is 'employee', they are ONLY allowed in /rotello/* routes!
    if (userRole === "employee") {
      const isAdminRoute = ADMIN_ONLY_PATHS.some(
        (p) => pathname === p || pathname.startsWith(`${p}/`)
      );

      if (isAdminRoute || pathname === "/" || pathname === "/admin-login") {
        return NextResponse.redirect(new URL("/rotello/my-tasks", req.url));
      }
    }

    return NextResponse.next();
  } catch (err) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
