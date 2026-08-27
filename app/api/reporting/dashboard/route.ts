import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { dailyStats, dailyReports, employees, reportItems } from "@/lib/db/schema";
import { eq, and, gte, lte, isNull, inArray, desc } from "drizzle-orm";
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

    // Default to last 30 days if not provided
    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    const fromParam = searchParams.get("from") || getTehranDateString(defaultFrom);
    const toParam = searchParams.get("to") || todayStr;

    // Role-based Access Scope (Section 7)
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

    // 2. Check if the range includes "today" (Live Query Trade-off from Section 4)
    let todayIncluded = toParam >= todayStr && fromParam <= todayStr;
    let todayLiveStat: any = null;

    if (todayIncluded) {
      // Fetch live data for today
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

      const reportIds = filteredReports.map((r: any) => r.id);
      let totalTasksToday = 0;
      let doneTasksToday = 0;

      if (reportIds.length > 0) {
        const items: any[] = await db
          .select({
            id: reportItems.id,
            status: reportItems.status,
          })
          .from(reportItems)
          .where(inArray(reportItems.reportId, reportIds));

        totalTasksToday = items.length;
        doneTasksToday = items.filter((i: any) => i.status === "done").length;
      }

      todayLiveStat = {
        statDate: todayStr,
        department: department || null,
        activeEmployees: activeEmployees.length,
        submittedCount: filteredReports.length,
        onTimeCount: filteredReports.filter((r: any) => r.status === "on_time").length,
        lateCount: filteredReports.filter((r: any) => r.status === "late").length,
        totalTaskItems: totalTasksToday,
        doneTaskItems: doneTasksToday,
        isLiveToday: true,
      };
    }

    // Merge historical stats + today's live stats
    // Exclude any pre-existing record for today in historicalStats to prevent double counting
    const mergedStats = historicalStats.filter((s: any) => s.statDate !== todayStr);
    if (todayLiveStat) {
      mergedStats.push(todayLiveStat);
    }

    // 3. Compute exact mathematical metrics (Section 3)
    let totalActiveEmployeesDays = 0;
    let totalSubmitted = 0;
    let totalOnTime = 0;
    let totalLate = 0;
    let totalTasks = 0;
    let totalDoneTasks = 0;

    for (const stat of mergedStats) {
      totalActiveEmployeesDays += stat.activeEmployees;
      totalSubmitted += stat.submittedCount;
      totalOnTime += stat.onTimeCount;
      totalLate += stat.lateCount;
      totalTasks += stat.totalTaskItems;
      totalDoneTasks += stat.doneTaskItems;
    }

    const completionRate =
      totalActiveEmployeesDays > 0
        ? Math.round((totalSubmitted / totalActiveEmployeesDays) * 100)
        : 0;

    const onTimeRate =
      totalSubmitted > 0 ? Math.round((totalOnTime / totalSubmitted) * 100) : 0;

    const taskCompletionRatio =
      totalTasks > 0 ? Math.round((totalDoneTasks / totalTasks) * 100) : 0;

    const totalMissing = Math.max(0, totalActiveEmployeesDays - totalSubmitted);

    const averageTasksPerReport =
      totalSubmitted > 0 ? (totalTasks / totalSubmitted).toFixed(1) : "0";

    return NextResponse.json({
      period: { from: fromParam, to: toParam, department: department || "all" },
      kpis: {
        completionRate, // %
        onTimeRate, // %
        taskCompletionRatio, // %
        totalSubmitted,
        totalMissing,
        totalOnTime,
        totalLate,
        totalTasks,
        totalDoneTasks,
        averageTasksPerReport,
        activeEmployeeDays: totalActiveEmployeesDays,
      },
      dailyBreakdown: mergedStats,
    });
  } catch (error: any) {
    console.error("Reporting dashboard error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
