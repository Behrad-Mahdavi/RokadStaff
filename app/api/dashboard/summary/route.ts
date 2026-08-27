import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { employees, dailyReports, reportItems } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
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
        status: dailyReports.status,
        submittedAt: dailyReports.submittedAt,
        editedCount: dailyReports.editedCount,
        employeeFullName: employees.fullName,
        employeeDepartment: employees.department,
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

    // 3. Task breakdown for today
    let totalTasksToday = 0;
    let doneTasksToday = 0;
    let incompleteTasksToday = 0;
    let cancelledTasksToday = 0;

    if (todayReports.length > 0) {
      const todayReportIds = todayReports.map((r: any) => r.id);
      const items: any[] = await db
        .select()
        .from(reportItems)
        .where(inArray(reportItems.reportId, todayReportIds));

      totalTasksToday = items.length;
      doneTasksToday = items.filter((i: any) => i.status === "done").length;
      incompleteTasksToday = items.filter((i: any) => i.status === "incomplete").length;
      cancelledTasksToday = items.filter((i: any) => i.status === "cancelled").length;
    }

    const taskCompletionRate =
      totalTasksToday > 0 ? Math.round((doneTasksToday / totalTasksToday) * 100) : 0;

    // 4. Department breakdown
    const departmentStats: Record<string, { total: number; submitted: number }> = {};
    activeEmployees.forEach((emp: any) => {
      const dept = emp.department || "عمومی";
      if (!departmentStats[dept]) {
        departmentStats[dept] = { total: 0, submitted: 0 };
      }
      departmentStats[dept].total++;
    });

    todayReports.forEach((rep: any) => {
      const dept = rep.employeeDepartment || "عمومی";
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
      tasks: {
        total: totalTasksToday,
        done: doneTasksToday,
        incomplete: incompleteTasksToday,
        cancelled: cancelledTasksToday,
        completionRate: taskCompletionRate,
      },
      departments: departmentStats,
      recentReports: todayReports.slice(0, 6),
    });
  } catch (error: any) {
    console.error("Dashboard summary error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
