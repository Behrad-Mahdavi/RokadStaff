import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { dailyReports, employees, reportItems } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
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
    const employeeId = searchParams.get("employeeId");
    const department = searchParams.get("department");
    const status = searchParams.get("status");

    const db = getDb();

    const conditions = [];

    if (dateParam && dateParam !== "all") {
      conditions.push(eq(dailyReports.reportDate, dateParam));
    }

    if (employeeId && employeeId !== "all") {
      conditions.push(eq(dailyReports.employeeId, employeeId));
    }

    if (status && status !== "all") {
      conditions.push(eq(dailyReports.status, status));
    }

    // Fetch reports with employee join
    const reportsQuery = db
      .select({
        id: dailyReports.id,
        employeeId: dailyReports.employeeId,
        reportDate: dailyReports.reportDate,
        rawText: dailyReports.rawText,
        status: dailyReports.status,
        submittedAt: dailyReports.submittedAt,
        editedCount: dailyReports.editedCount,
        createdAt: dailyReports.createdAt,
        employeeFullName: employees.fullName,
        employeeDepartment: employees.department,
        employeePosition: employees.position,
        employeeIsActive: employees.isActive,
      })
      .from(dailyReports)
      .innerJoin(employees, eq(dailyReports.employeeId, employees.id))
      .orderBy(desc(dailyReports.submittedAt));

    if (conditions.length > 0) {
      // @ts-ignore
      reportsQuery.where(and(...conditions));
    }

    const reports = await reportsQuery;

    // Filter department in-memory if requested (or inside query)
    const filteredReports = department && department !== "all"
      ? reports.filter((r: any) => r.employeeDepartment === department)
      : reports;

    // Fetch all items for these reports
    const reportIds = filteredReports.map((r: any) => r.id);
    let itemsByReportId: Record<string, any[]> = {};

    if (reportIds.length > 0) {
      const allItems = await db
        .select()
        .from(reportItems)
        .where(inArray(reportItems.reportId, reportIds))
        .orderBy(reportItems.taskOrder);

      for (const item of allItems) {
        if (!itemsByReportId[item.reportId]) {
          itemsByReportId[item.reportId] = [];
        }
        itemsByReportId[item.reportId].push(item);
      }
    }

    const enhancedReports = filteredReports.map((r: any) => {
      const items = itemsByReportId[r.id] || [];
      const doneCount = items.filter((i) => i.status === "done").length;
      const incompleteCount = items.filter((i) => i.status === "incomplete").length;
      const cancelledCount = items.filter((i) => i.status === "cancelled").length;

      return {
        ...r,
        items,
        stats: {
          totalTasks: items.length,
          doneTasks: doneCount,
          incompleteTasks: incompleteCount,
          cancelledTasks: cancelledCount,
          completionRate: items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0,
        },
      };
    });

    return NextResponse.json({
      date: dateParam,
      total: enhancedReports.length,
      reports: enhancedReports,
    });
  } catch (error: any) {
    console.error("Fetch reports error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
