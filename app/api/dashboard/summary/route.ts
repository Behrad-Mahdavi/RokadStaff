import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { employees, dailyReports } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getTehranDateString } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const todayStr = getTehranDateString();
    const db = getDb();

    // 1. Total employees stats
    const allEmployees: any[] = await db.select().from(employees);
    const activeEmployees = allEmployees.filter((e: any) => e.isActive);
    const linkedEmployees = activeEmployees.filter((e: any) => !!e.telegramChatId);

    // 2. Today's reports
    const todayReports: any[] = await db
      .select({
        id: dailyReports.id,
        employeeId: dailyReports.employeeId,
        reportDate: dailyReports.reportDate,
        rawText: dailyReports.rawText,
        status: dailyReports.status,
        submittedAt: dailyReports.submittedAt,
        editedCount: dailyReports.editedCount,
        employeeFullName: employees.fullName,
        employeeDepartment: employees.department,
        employeePosition: employees.position,
      })
      .from(dailyReports)
      .innerJoin(employees, eq(dailyReports.employeeId, employees.id))
      .where(eq(dailyReports.reportDate, todayStr))
      .orderBy(desc(dailyReports.submittedAt));

    const onTimeCount = todayReports.filter((r: any) => r.status === "on_time").length;
    const lateCount = todayReports.filter((r: any) => r.status === "late").length;
    const submittedCount = todayReports.length;
    const missingCount = Math.max(0, activeEmployees.length - submittedCount);
    const participationRate =
      activeEmployees.length > 0
        ? Math.round((submittedCount / activeEmployees.length) * 100)
        : 0;

    // 3. Department breakdown
    const departmentStats: Record<string, { total: number; submitted: number }> = {};
    activeEmployees.forEach((emp: any) => {
      const dept = emp.department || "پسرانه";
      if (!departmentStats[dept]) {
        departmentStats[dept] = { total: 0, submitted: 0 };
      }
      departmentStats[dept].total++;
    });

    todayReports.forEach((rep: any) => {
      const dept = rep.employeeDepartment || "پسرانه";
      if (departmentStats[dept]) {
        departmentStats[dept].submitted++;
      }
    });

    return NextResponse.json({
      todayDate: todayStr,
      overview: {
        totalStaff: allEmployees.length,
        activeStaff: activeEmployees.length,
        linkedStaff: linkedEmployees.length,
        todaySubmitted: submittedCount,
        todayMissing: missingCount,
        todayOnTime: onTimeCount,
        todayLate: lateCount,
        participationRate,
      },
      departments: departmentStats,
      recentReports: todayReports.slice(0, 10),
    });
  } catch (error: any) {
    console.error("Dashboard summary error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
