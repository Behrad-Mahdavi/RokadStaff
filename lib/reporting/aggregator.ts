import { getDb } from "../db/client";
import {
  dailyStats,
  dailyReports,
  employees,
  reportItems,
} from "../db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getTehranDateString } from "../utils";

/**
 * Aggregates daily report metrics for a specific date and writes into daily_stats table (idempotent UPSERT).
 * If no date is passed, defaults to yesterday in Tehran timezone.
 */
export async function aggregateDailyStats(targetDate?: string) {
  const db = getDb();

  // If no date specified, calculate for yesterday
  let statDate = targetDate;
  if (!statDate) {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    statDate = getTehranDateString(d);
  }

  // 1. Get all employees who are active
  const allEmployees: any[] = await db.select().from(employees);
  const activeEmployees = allEmployees.filter((e: any) => e.isActive);

  // 2. Get all reports submitted for this date
  const dateReports: any[] = await db
    .select({
      id: dailyReports.id,
      employeeId: dailyReports.employeeId,
      status: dailyReports.status,
      employeeDepartment: employees.department,
    })
    .from(dailyReports)
    .innerJoin(employees, eq(dailyReports.employeeId, employees.id))
    .where(eq(dailyReports.reportDate, statDate));

  const reportIds = dateReports.map((r: any) => r.id);
  let totalTasks = 0;
  let doneTasks = 0;
  const tasksByReportId: Record<string, { total: number; done: number }> = {};

  if (reportIds.length > 0) {
    const items: any[] = await db
      .select({
        reportId: reportItems.reportId,
        status: reportItems.status,
      })
      .from(reportItems)
      .where(inArray(reportItems.reportId, reportIds));

    totalTasks = items.length;
    doneTasks = items.filter((i: any) => i.status === "done").length;

    for (const item of items) {
      if (!tasksByReportId[item.reportId]) {
        tasksByReportId[item.reportId] = { total: 0, done: 0 };
      }
      tasksByReportId[item.reportId].total++;
      if (item.status === "done") {
        tasksByReportId[item.reportId].done++;
      }
    }
  }

  // 3. Organization-wide aggregation (department = null)
  const orgSubmittedCount = dateReports.length;
  const orgOnTimeCount = dateReports.filter((r: any) => r.status === "on_time").length;
  const orgLateCount = dateReports.filter((r: any) => r.status === "late").length;

  const resultsToUpsert: Array<{
    statDate: string;
    department: string | null;
    activeEmployees: number;
    submittedCount: number;
    onTimeCount: number;
    lateCount: number;
    totalTaskItems: number;
    doneTaskItems: number;
  }> = [
    {
      statDate,
      department: null,
      activeEmployees: activeEmployees.length,
      submittedCount: orgSubmittedCount,
      onTimeCount: orgOnTimeCount,
      lateCount: orgLateCount,
      totalTaskItems: totalTasks,
      doneTaskItems: doneTasks,
    },
  ];

  // 4. Per-department aggregation
  const departments = Array.from(
    new Set(activeEmployees.map((e: any) => e.department || "عمومی").filter(Boolean))
  );

  for (const dept of departments) {
    const deptActive = activeEmployees.filter((e: any) => (e.department || "عمومی") === dept);
    const deptReports = dateReports.filter((r: any) => (r.employeeDepartment || "عمومی") === dept);
    const deptOnTime = deptReports.filter((r: any) => r.status === "on_time").length;
    const deptLate = deptReports.filter((r: any) => r.status === "late").length;

    let deptTotalTasks = 0;
    let deptDoneTasks = 0;

    for (const rep of deptReports) {
      const repTaskStats = tasksByReportId[rep.id];
      if (repTaskStats) {
        deptTotalTasks += repTaskStats.total;
        deptDoneTasks += repTaskStats.done;
      }
    }

    resultsToUpsert.push({
      statDate,
      department: dept as string,
      activeEmployees: deptActive.length,
      submittedCount: deptReports.length,
      onTimeCount: deptOnTime,
      lateCount: deptLate,
      totalTaskItems: deptTotalTasks,
      doneTaskItems: deptDoneTasks,
    });
  }

  // 5. Idempotent UPSERT into daily_stats
  for (const record of resultsToUpsert) {
    await db
      .insert(dailyStats)
      .values({
        statDate: record.statDate,
        department: record.department,
        activeEmployees: record.activeEmployees,
        submittedCount: record.submittedCount,
        onTimeCount: record.onTimeCount,
        lateCount: record.lateCount,
        totalTaskItems: record.totalTaskItems,
        doneTaskItems: record.doneTaskItems,
        computedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [dailyStats.statDate, dailyStats.department],
        set: {
          activeEmployees: record.activeEmployees,
          submittedCount: record.submittedCount,
          onTimeCount: record.onTimeCount,
          lateCount: record.lateCount,
          totalTaskItems: record.totalTaskItems,
          doneTaskItems: record.doneTaskItems,
          computedAt: new Date(),
        },
      });
  }

  return {
    success: true,
    statDate,
    aggregatedRows: resultsToUpsert.length,
  };
}
