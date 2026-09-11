import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { dailyStats, dailyReports, employees } from "@/lib/db/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getTehranDateString, isFriday } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const fromParam = searchParams.get("from") || getTehranDateString();
    const toParam = searchParams.get("to") || getTehranDateString();
    let department = searchParams.get("department");

    if (session.role === "supervisor" && (session as any).assignedDepartment) {
      department = (session as any).assignedDepartment;
    }

    const db = getDb();
    const todayStr = getTehranDateString();

    // 1. Fetch aggregated stats from daily_stats table
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
      .where(and(...conditions));

    // 2. If today is within range, fetch today's live stats
    let todayLiveStat: any = null;
    if (todayStr >= fromParam && todayStr <= toParam) {
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
      const dayIsFriday = isFriday(stat.statDate);
      if (dayIsFriday) {
        // Friday is not a mandatory workday:
        // Submitted reports on Friday are counted, but unsubmitted staff are not counted as missing
        totalActiveEmployeesDays += stat.submittedCount;
        totalSubmitted += stat.submittedCount;
        totalOnTime += stat.onTimeCount;
        totalLate += stat.lateCount;
      } else {
        totalActiveEmployeesDays += stat.activeEmployees;
        totalSubmitted += stat.submittedCount;
        totalOnTime += stat.onTimeCount;
        totalLate += stat.lateCount;
      }
    }

    const completionRate =
      totalActiveEmployeesDays > 0
        ? Math.round((totalSubmitted / totalActiveEmployeesDays) * 100)
        : 0;

    const onTimeRate =
      totalSubmitted > 0 ? Math.round((totalOnTime / totalSubmitted) * 100) : 0;

    const totalMissing = Math.max(0, totalActiveEmployeesDays - totalSubmitted);

    const enrichedDailyBreakdown = mergedStats.map((s: any) => ({
      ...s,
      isFriday: isFriday(s.statDate),
    }));

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
      dailyBreakdown: enrichedDailyBreakdown,
    });
  } catch (error: any) {
    console.error("Reporting dashboard error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
