import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { dailyReports, employees, reportItems, reportHistory } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

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
    const reportResult = await db
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
      .where(eq(dailyReports.id, params.id))
      .limit(1);

    if (reportResult.length === 0) {
      return NextResponse.json({ error: "گزارش یافت نشد." }, { status: 404 });
    }

    const report = reportResult[0];

    // Fetch items
    const items = await db
      .select()
      .from(reportItems)
      .where(eq(reportItems.reportId, report.id))
      .orderBy(reportItems.taskOrder);

    // Fetch audit history
    const history = await db
      .select()
      .from(reportHistory)
      .where(eq(reportHistory.originalReportId, report.id))
      .orderBy(desc(reportHistory.replacedAt));

    return NextResponse.json({
      report: {
        ...report,
        items,
        history,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
