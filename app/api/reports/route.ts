import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { dailyReports, employees, reportItems, reportHistory } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getTehranDateString, isSubmissionLate } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const allDates = searchParams.get("allDates") === "true";
    const dateParam = searchParams.get("date");
    let employeeId = searchParams.get("employeeId");
    const department = searchParams.get("department");
    const status = searchParams.get("status");

    // If logged in as employee, always scope to their own employeeId
    if (session.role === "employee" && session.employeeId) {
      employeeId = session.employeeId;
    }

    const db = getDb();
    const conditions = [];

    // Filter by date if specified and not 'all'
    if (!allDates && dateParam && dateParam !== "all") {
      conditions.push(eq(dailyReports.reportDate, dateParam));
    } else if (!allDates && !dateParam && session.role !== "employee") {
      // Default to today's date for admin dashboard unless allDates is requested
      conditions.push(eq(dailyReports.reportDate, getTehranDateString()));
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
      .orderBy(desc(dailyReports.reportDate), desc(dailyReports.submittedAt));

    if (conditions.length > 0) {
      // @ts-ignore
      reportsQuery.where(and(...conditions));
    }

    const reports = await reportsQuery;

    // Filter department: strictly enforce supervisor department if supervisor
    const effectiveDept =
      session.role === "supervisor" && session.assignedDepartment
        ? session.assignedDepartment
        : department;

    const filteredReports = effectiveDept && effectiveDept !== "all"
      ? reports.filter((r: any) => r.employeeDepartment === effectiveDept)
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
      date: dateParam || getTehranDateString(),
      total: enhancedReports.length,
      reports: enhancedReports,
    });
  } catch (error: any) {
    console.warn("Fetch reports error / DB offline:", error);
    return NextResponse.json({
      date: new Date().toISOString().slice(0, 10),
      total: 0,
      reports: [],
    });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { rawText, items, reportDate: customDate } = body;

    // Determine target employee
    const employeeId = session.role === "employee"
      ? session.employeeId
      : (body.employeeId || session.employeeId);

    if (!employeeId) {
      return NextResponse.json(
        { error: "شناسه همکار برای ثبت گزارش مشخص نیست." },
        { status: 400 }
      );
    }

    const reportDateStr = customDate || getTehranDateString();

    // Determine on_time vs late status
    const isLate = isSubmissionLate();
    const submissionStatus = isLate ? "late" : "on_time";

    // Build rawText if not provided directly
    let finalRawText = (rawText || "").trim();
    const validItems: Array<{ description: string; status: string; taskOrder: number }> = [];

    if (Array.isArray(items) && items.length > 0) {
      items.forEach((it: any, index: number) => {
        const desc = (it.description || "").trim();
        if (desc) {
          validItems.push({
            description: desc,
            status: it.status || "done",
            taskOrder: index + 1,
          });
        }
      });
    }

    if (!finalRawText && validItems.length > 0) {
      finalRawText = `#گزارش_روزانه\n` + validItems.map((it) => {
        const mark = it.status === "done" ? "✅" : it.status === "incomplete" ? "⏳" : "❌";
        return `${mark} ${it.description}`;
      }).join("\n");
    }

    if (!finalRawText && validItems.length === 0) {
      return NextResponse.json(
        { error: "متن گزارش یا حداقل یک آیتم کاری باید وارد شود." },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check if report already exists for this employee and date
    const existing = await db
      .select()
      .from(dailyReports)
      .where(
        and(
          eq(dailyReports.employeeId, employeeId),
          eq(dailyReports.reportDate, reportDateStr)
        )
      )
      .limit(1);

    let reportId: string;
    let isEdit = false;

    if (existing.length > 0) {
      // Overwrite / update existing report
      isEdit = true;
      const prev = existing[0];
      reportId = prev.id;

      // 1. Audit trail in reportHistory
      try {
        await db.insert(reportHistory).values({
          originalReportId: prev.id,
          employeeId: employeeId,
          rawText: prev.rawText,
          replacedAt: new Date(),
        });
      } catch (histErr) {
        console.warn("Failed to write report history audit:", histErr);
      }

      // 2. Update daily_reports record
      await db
        .update(dailyReports)
        .set({
          rawText: finalRawText,
          // If previous was already on_time, keep on_time; otherwise update
          status: prev.status === "on_time" ? "on_time" : submissionStatus,
          submittedAt: new Date(),
          editedCount: (prev.editedCount || 0) + 1,
        })
        .where(eq(dailyReports.id, prev.id));

      // 3. Clear previous items and re-insert
      await db.delete(reportItems).where(eq(reportItems.reportId, prev.id));
    } else {
      // Insert brand new report
      const inserted = await db
        .insert(dailyReports)
        .values({
          employeeId,
          reportDate: reportDateStr,
          rawText: finalRawText,
          status: submissionStatus,
          submittedAt: new Date(),
          editedCount: 0,
        })
        .returning({ id: dailyReports.id });

      reportId = inserted[0].id;
    }

    // Insert task items
    if (validItems.length > 0) {
      await db.insert(reportItems).values(
        validItems.map((it) => ({
          reportId,
          taskOrder: it.taskOrder,
          description: it.description,
          status: it.status,
        }))
      );
    }

    return NextResponse.json({
      success: true,
      reportId,
      status: submissionStatus,
      isEdit,
      message: isEdit
        ? "گزارش روزانه شما با موفقیت ویرایش و به‌روزرسانی شد."
        : "گزارش روزانه شما با موفقیت ثبت گردید.",
    });
  } catch (error: any) {
    console.error("Submit report error:", error);
    return NextResponse.json(
      { error: error.message || "خطا در ثبت گزارش روزانه" },
      { status: 500 }
    );
  }
}
