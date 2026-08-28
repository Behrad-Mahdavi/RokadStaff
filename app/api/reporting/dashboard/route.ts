import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { dailyStats, dailyReports, employees } from "@/lib/db/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getTehranDateString } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const todayStr = getTehranDateString();

    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    const fromParam = searchParams.get("from") || getTehranDateString(defaultFrom);
    const toParam = searchParams.get("to") || todayStr;

    let department = searchParams.get("department") || undefined;
    if (session.role === "supervisor" && (session as any).assignedDepartment) {
      department = (session as any).assignedDepartment;
    }

    const db = getDb();

    // 1. Query historical aggregated stats from daily_stats
    const conditions = [
      gte(dailyStats.statDate, fromParam),
      lte(dailyStats.statDate, toParam),
    ];

    if (department && department !== "all") {
      conditions.push(eq(dailyStats.department, department));
    } else {
      conditions.push(isNull(dailyStats.department));
    }

    const historicalStats: any[] = await db
      .select()
      .from(dailyStats)
      .where(and(...conditions))
      .orderBy(dailyStats.statDate);

    // 2. Check if the range includes "today"
    let todayIncluded = toParam >= todayStr && fromParam <= todayStr;
    let todayLiveStat: any = null;

    if (todayIncluded) {
      const allEmployees: any[] = await db.select().from(employees);
      let activeEmployees = allEmployees.filter((e: any) => e.isActive);
      if (department && department !== "all") {
        activeEmployees = activeEmployees.filter((e: any) => e.department === department);
      }

      const todayReportsQuery = db
        .select({
          id: dailyReports.id,
          employeeId: dailyReports.employeeId,
          status: dailyReports.status,
          employeeDepartment: employees.department,
        })
        .from(dailyReports)
        .innerJoin(employees, eq(dailyReports.employeeId, employees.id))
        .where(eq(dailyReports.reportDate, todayStr));

      const todayReports: any[] = await todayReportsQuery;
      const filteredReports = department && department !== "all"
        ? todayReports.filter((r: any) => r.employeeDepartment === department)
        : todayReports;

      todayLiveStat = {
        statDate: todayStr,
        department: department || null,
        activeEmployees: activeEmployees.length,
        submittedCount: filteredReports.length,
        onTimeCount: filteredReports.filter((r: any) => r.status === "on_time").length,
        lateCount: filteredReports.filter((r: any) => r.status === "late").length,
        totalTaskItems: 0,
        doneTaskItems: 0,
        isLiveToday: true,
      };
    }

    const mergedStats = historicalStats.filter((s: any) => s.statDate !== todayStr);
    if (todayLiveStat) {
      mergedStats.push(todayLiveStat);
    }

    let totalActiveEmployeesDays = 0;
    let totalSubmitted = 0;
    let totalOnTime = 0;
    let totalLate = 0;

    for (const stat of mergedStats) {
      totalActiveEmployeesDays += stat.activeEmployees;
      totalSubmitted += stat.submittedCount;
      totalOnTime += stat.onTimeCount;
      totalLate += stat.lateCount;
    }

    const completionRate =
      totalActiveEmployeesDays > 0
        ? Math.round((totalSubmitted / totalActiveEmployeesDays) * 100)
        : 0;

    const onTimeRate =
      totalSubmitted > 0 ? Math.round((totalOnTime / totalSubmitted) * 100) : 0;

    const totalMissing = Math.max(0, totalActiveEmployeesDays - totalSubmitted);

    return NextResponse.json({
      period: { from: fromParam, to: toParam, department: department || "all" },
      kpis: {
        completionRate, // %
        onTimeRate, // %
        totalSubmitted,
        totalMissing,
        totalOnTime,
        totalLate,
        activeEmployeeDays: totalActiveEmployeesDays,
      },
      dailyBreakdown: mergedStats,
    });
  } catch (error: any) {
    console.error("Reporting dashboard error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
