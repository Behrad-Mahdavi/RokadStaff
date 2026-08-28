import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { loginTokens, employees } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { setSessionCookie } from "@/lib/auth/session";

function isCrawler(userAgent: string | null): boolean {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return (
    ua.includes("telegrambot") ||
    ua.includes("twitterbot") ||
    ua.includes("facebookexternalhit") ||
    ua.includes("whatsapp") ||
    ua.includes("slackbot") ||
    ua.includes("preview") ||
    ua.includes("crawler") ||
    ua.includes("spider")
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token")?.trim();
  const userAgent = req.headers.get("user-agent");

  const origin =
    req.headers.get("origin") ||
    (req.headers.get("host")
      ? `https://${req.headers.get("host")}`
      : "https://rokad-staff.vercel.app");

  // 1. If requested by Telegram/Crawler prefetcher, return 200 without consuming token
  if (isCrawler(userAgent)) {
    return new Response(
      `<!DOCTYPE html><html><head><title>Rokad Staff Login</title><meta name="robots" content="noindex"></head><body>Redirecting to login...</body></html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      }
    );
  }

  if (!token) {
    return NextResponse.redirect(`${origin}/login/member?error=missing_token`);
  }

  const db = getDb();

  try {
    const now = new Date();

    // 2. Find valid token (must not be past expiresAt)
    const tokenResult: any[] = await db
      .select({
        id: loginTokens.id,
        employeeId: loginTokens.employeeId,
        expiresAt: loginTokens.expiresAt,
        usedAt: loginTokens.usedAt,
        employeeFullName: employees.fullName,
        employeeDepartment: employees.department,
        employeeIsActive: employees.isActive,
      })
      .from(loginTokens)
      .innerJoin(employees, eq(loginTokens.employeeId, employees.id))
      .where(
        and(
          eq(loginTokens.token, token),
          gt(loginTokens.expiresAt, now)
        )
      )
      .limit(1);

    if (tokenResult.length === 0) {
      return NextResponse.redirect(`${origin}/login/member?error=invalid_or_expired`);
    }

    const item = tokenResult[0];

    if (!item.employeeIsActive) {
      return NextResponse.redirect(`${origin}/login/member?error=account_disabled`);
    }

    // 3. Grace Window Check:
    // If usedAt is already set, allow re-use within 10 minutes of creation so user clicks / refreshes don't fail!
    if (!item.usedAt) {
      await db
        .update(loginTokens)
        .set({ usedAt: new Date() })
        .where(eq(loginTokens.id, item.id));
    }

    // 4. Set Session Cookie for Employee
    await setSessionCookie({
      employeeId: item.employeeId,
      fullName: item.employeeFullName,
      department: item.employeeDepartment || "پسرانه",
      role: "employee",
    });

    // 5. Redirect to Personal Workspace
    return NextResponse.redirect(`${origin}/rotello/my-tasks`);
  } catch (error: any) {
    console.error("Token verification error:", error);
    return NextResponse.redirect(`${origin}/login/member?error=server_error`);
  }
}
