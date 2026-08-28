import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { loginTokens, employees } from "@/lib/db/schema";
import { eq, and, gt, isNull } from "drizzle-orm";
import { setSessionCookie } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  const origin =
    req.headers.get("origin") ||
    (req.headers.get("host") ? `https://${req.headers.get("host")}` : "https://rokad-staff.vercel.app");

  if (!token) {
    return NextResponse.redirect(`${origin}/login/member?error=missing_token`);
  }

  const db = getDb();

  try {
    const now = new Date();

    // 1. Find valid unused token
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
          isNull(loginTokens.usedAt),
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

    // 2. Mark token as used
    await db
      .update(loginTokens)
      .set({ usedAt: new Date() })
      .where(eq(loginTokens.id, item.id));

    // 3. Set Session Cookie for Employee
    await setSessionCookie({
      employeeId: item.employeeId,
      fullName: item.employeeFullName,
      department: item.employeeDepartment || "پسرانه",
      role: "employee",
    });

    // 4. Redirect to Personal Workspace
    return NextResponse.redirect(`${origin}/rotello/my-tasks`);
  } catch (error: any) {
    console.error("Token verification error:", error);
    return NextResponse.redirect(`${origin}/login/member?error=server_error`);
  }
}
