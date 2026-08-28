import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { employees, dailyReports } from "@/lib/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
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

    // 3. Compute Streak (consecutive days of reporting backwards from today/yesterday)
    let currentStreak = 0;
    const reportDatesSet = new Set(reports.map((r: any) => r.reportDate));
    const checkDate = new Date();

    for (let i = 0; i < 60; i++) {
      const dateStr = getTehranDateString(checkDate);
      if (reportDatesSet.has(dateStr)) {
        currentStreak++;
      } else {
        if (i === 0 && !reportDatesSet.has(dateStr)) {
          // today is not yet reported, check yesterday
        } else {
          break;
        }
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }

    const enhancedReports = reports.map((r: any) => ({
      ...r,
      reportDateJalali: formatToJalali(r.reportDate),
      submittedAtTime: formatTehranTime(r.submittedAt),
    }));

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
      },
      reports: enhancedReports,
    });
  } catch (error: any) {
    console.error("Employee history error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
