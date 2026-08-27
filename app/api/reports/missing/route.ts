import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { employees, dailyReports } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getTehranDateString } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const dateParam = searchParams.get("date") || getTehranDateString();
    const department = searchParams.get("department");

    const db = getDb();

    // 1. Get all active employees
    const activeEmployees = await db
      .select()
      .from(employees)
      .where(eq(employees.isActive, true));

    // 2. Get all submitted reports for this date
    const reportsForDate = await db
      .select({ employeeId: dailyReports.employeeId })
      .from(dailyReports)
      .where(eq(dailyReports.reportDate, dateParam));

    const submittedSet = new Set(reportsForDate.map((r: { employeeId: string }) => r.employeeId));

    // 3. Filter missing employees
    let missing = activeEmployees.filter((emp: any) => !submittedSet.has(emp.id));

    if (department && department !== "all") {
      missing = missing.filter((emp: any) => emp.department === department);
    }

    const serialized = missing.map((emp: any) => ({
      ...emp,
      telegramChatId: emp.telegramChatId ? emp.telegramChatId.toString() : null,
      isLinked: !!emp.telegramChatId,
    }));

    return NextResponse.json({
      date: dateParam,
      totalMissing: serialized.length,
      missingEmployees: serialized,
    });
  } catch (error: any) {
    console.error("Missing reports error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
