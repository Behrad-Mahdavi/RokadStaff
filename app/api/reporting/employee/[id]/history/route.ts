import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { employees, dailyReports, reportItems } from "@/lib/db/schema";
import { eq, and, desc, inArray, gte, lte } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { formatToJalali, formatTehranTime, getTehranDateString } from "@/lib/utils";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);

    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    const fromParam = searchParams.get("from") || getTehranDateString(defaultFrom);
    const toParam = searchParams.get("to") || getTehranDateString();

    // 1. Get employee
    const empResult = await db
      .select()
      .from(employees)
      .where(eq(employees.id, params.id))
      .limit(1);

    if (empResult.length === 0) {
      return NextResponse.json({ error: "کارمند یافت نشد" }, { status: 404 });
    }

    const emp = empResult[0];

    // Access scope check: if supervisor, verify department
    if (
      session.role === "supervisor" &&
      (session as any).assignedDepartment &&
      emp.department !== (session as any).assignedDepartment
    ) {
      return NextResponse.json({ error: "دسترسی غیرمجاز به این دپارتمان" }, { status: 403 });
    }

    // 2. Fetch all reports for this employee
    const reports: any[] = await db
      .select()
      .from(dailyReports)
      .where(
        and(
          eq(dailyReports.employeeId, emp.id),
          gte(dailyReports.reportDate, fromParam),
          lte(dailyReports.reportDate, toParam)
        )
      )
      .orderBy(desc(dailyReports.reportDate));

    const reportIds = reports.map((r: any) => r.id);
    let itemsByReportId: Record<string, any[]> = {};

    if (reportIds.length > 0) {
      const items: any[] = await db
        .select()
        .from(reportItems)
        .where(inArray(reportItems.reportId, reportIds))
        .orderBy(reportItems.taskOrder);

      for (const item of items) {
        if (!itemsByReportId[item.reportId]) {
          itemsByReportId[item.reportId] = [];
        }
        itemsByReportId[item.reportId].push(item);
      }
    }

    // 3. Compute Streak (consecutive days of reporting backwards from today/yesterday)
    let currentStreak = 0;
    const reportDatesSet = new Set(reports.map((r: any) => r.reportDate));
    const checkDate = new Date();

    // Check if reported today or yesterday to start streak
    for (let i = 0; i < 60; i++) {
      const dateStr = getTehranDateString(checkDate);
      if (reportDatesSet.has(dateStr)) {
        currentStreak++;
      } else {
        // If not today (e.g. today is not over yet), allow check from yesterday
        if (i === 0 && !reportDatesSet.has(dateStr)) {
          // today is not yet reported, check yesterday
        } else {
          break;
        }
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Task counts
    let totalTasks = 0;
    let doneTasks = 0;
    let incompleteTasks = 0;
    let cancelledTasks = 0;

    const enhancedReports = reports.map((r: any) => {
      const items = itemsByReportId[r.id] || [];
      const done = items.filter((i) => i.status === "done").length;
      const incomplete = items.filter((i) => i.status === "incomplete").length;
      const cancelled = items.filter((i) => i.status === "cancelled").length;

      totalTasks += items.length;
      doneTasks += done;
      incompleteTasks += incomplete;
      cancelledTasks += cancelled;

      return {
        ...r,
        reportDateJalali: formatToJalali(r.reportDate),
        submittedAtTime: formatTehranTime(r.submittedAt),
        items,
        stats: {
          total: items.length,
          done,
          incomplete,
          cancelled,
          rate: items.length > 0 ? Math.round((done / items.length) * 100) : 0,
        },
      };
    });

    const onTimeCount = reports.filter((r) => r.status === "on_time").length;
    const lateCount = reports.filter((r) => r.status === "late").length;

    return NextResponse.json({
      employee: {
        id: emp.id,
        fullName: emp.fullName,
        department: emp.department,
        position: emp.position,
        isActive: emp.isActive,
        isLinked: !!emp.telegramChatId,
      },
      summary: {
        streak: currentStreak,
        totalSubmitted: reports.length,
        onTimeCount,
        lateCount,
        onTimeRate: reports.length > 0 ? Math.round((onTimeCount / reports.length) * 100) : 0,
        totalTasks,
        doneTasks,
        incompleteTasks,
        cancelledTasks,
        taskCompletionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
        averageTasksPerReport: reports.length > 0 ? (totalTasks / reports.length).toFixed(1) : "0",
      },
      reports: enhancedReports,
    });
  } catch (error: any) {
    console.error("Employee history error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
