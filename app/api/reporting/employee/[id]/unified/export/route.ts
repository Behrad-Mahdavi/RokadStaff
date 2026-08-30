import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import {
  employees,
  tasks,
  taskAssignees,
  projects,
  boardColumns,
  checklists,
  checklistItems,
  taskReports,
  dailyReports,
  reportItems,
} from "@/lib/db/schema";
import { eq, and, desc, inArray, gte, lte } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { formatToJalali, formatTehranTime, getTehranDateString } from "@/lib/utils";
import ExcelJS from "exceljs";

// GET /api/reporting/employee/[id]/unified/export?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const employeeId = params.id;
  const { searchParams } = new URL(req.url);
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const db = getDb();

  try {
    // 1. Fetch employee
    const empResult: any[] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (empResult.length === 0) {
      return NextResponse.json({ error: "کارمند یافت نشد." }, { status: 404 });
    }

    const employee = empResult[0];

    const toDate = toParam ? new Date(toParam + "T23:59:59.999Z") : new Date();
    const fromDate = fromParam
      ? new Date(fromParam + "T00:00:00.000Z")
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const fromDateStr = fromDate.toISOString().split("T")[0];
    const toDateStr = toDate.toISOString().split("T")[0];

    // 2. Fetch Active Tasks & Completed Tasks (Rotello)
    const activeAssignments: any[] = await db
      .select({ taskId: taskAssignees.taskId })
      .from(taskAssignees)
      .where(eq(taskAssignees.employeeId, employeeId));

    const assignedTaskIds = activeAssignments.map((a) => a.taskId);

    let allTasksRaw: any[] = [];
    if (assignedTaskIds.length > 0) {
      allTasksRaw = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          description: tasks.description,
          deadline: tasks.deadline,
          priority: tasks.priority,
          status: tasks.status,
          projectId: tasks.projectId,
          projectName: projects.name,
          columnName: boardColumns.name,
          isDoneColumn: boardColumns.isDoneColumn,
          completedAt: tasks.completedAt,
          createdAt: tasks.createdAt,
        })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .leftJoin(boardColumns, eq(tasks.columnId, boardColumns.id))
        .where(
          and(
            inArray(tasks.id, assignedTaskIds),
            eq(tasks.isDeleted, false) // Decision 3: Exclude deleted tasks
          )
        )
        .orderBy(desc(tasks.createdAt));
    }

    const openTasks = allTasksRaw.filter((t) =>
      t.projectId ? !t.isDoneColumn : t.status === "todo" || t.status === "in_progress"
    );

    const completedTasksInRange = allTasksRaw.filter((t) => {
      if (!t.completedAt) return false;
      const cDate = new Date(t.completedAt);
      return cDate >= fromDate && cDate <= toDate;
    });

    // Task Reports in range
    const taskReportsInRange = await db
      .select({
        id: taskReports.id,
        taskId: taskReports.taskId,
        taskTitle: tasks.title,
        projectName: projects.name,
        content: taskReports.content,
        createdAt: taskReports.createdAt,
      })
      .from(taskReports)
      .innerJoin(tasks, eq(taskReports.taskId, tasks.id))
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(taskReports.authorId, employeeId),
          gte(taskReports.createdAt, fromDate),
          lte(taskReports.createdAt, toDate),
          eq(tasks.isDeleted, false)
        )
      )
      .orderBy(desc(taskReports.createdAt));

    // Daily Reports in range
    const dailyReportsRaw: any[] = await db
      .select()
      .from(dailyReports)
      .where(
        and(
          eq(dailyReports.employeeId, employeeId),
          gte(dailyReports.reportDate, fromDateStr),
          lte(dailyReports.reportDate, toDateStr)
        )
      )
      .orderBy(desc(dailyReports.reportDate));

    // 3. Build Multi-Sheet Excel Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Rokad Staff Platform";
    workbook.created = new Date();

    // ==========================================
    // SHEET 1: Rotello Tasks & Activity
    // ==========================================
    const sheet1 = workbook.addWorksheet("عملکرد تسک‌ها (Rotello)", {
      views: [{ rightToLeft: true }],
    });

    sheet1.columns = [
      { header: "ردیف", key: "rowNum", width: 8 },
      { header: "عنوان تسک", key: "title", width: 28 },
      { header: "نوع / پروژه", key: "project", width: 22 },
      { header: "اولویت", key: "priority", width: 14 },
      { header: "مهلت (ددلاین)", key: "deadline", width: 16 },
      { header: "وضعیت فعلی", key: "status", width: 16 },
      { header: "تاریخ تکمیل", key: "completedAt", width: 16 },
    ];

    const h1 = sheet1.getRow(1);
    h1.font = { name: "Tahoma", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    h1.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF202A5A" },
    };
    h1.alignment = { vertical: "middle", horizontal: "center" };
    h1.height = 28;

    const allCombinedTasks = [...openTasks, ...completedTasksInRange];
    if (allCombinedTasks.length === 0) {
      sheet1.addRow({
        rowNum: 1,
        title: "هیچ تسکی برای این همکار در این بازه یافت نشد.",
      });
    } else {
      allCombinedTasks.forEach((t, idx) => {
        const priorityFa =
          t.priority === "urgent"
            ? "فوری (Urgent)"
            : t.priority === "important"
            ? "مهم (Important)"
            : "عادی (Normal)";

        const statusFa = t.projectId
          ? t.columnName
          : t.status === "done"
          ? "انجام‌شده"
          : t.status === "in_progress"
          ? "در حال انجام"
          : "برای انجام";

        const row = sheet1.addRow({
          rowNum: idx + 1,
          title: t.title,
          project: t.projectName || "تسک فردی (مستقل)",
          priority: priorityFa,
          deadline: t.deadline ? formatToJalali(t.deadline) : "بدون ددلاین",
          status: statusFa,
          completedAt: t.completedAt ? formatToJalali(t.completedAt) : "-",
        });

        row.font = { name: "Tahoma", size: 10 };
        row.alignment = { vertical: "middle", horizontal: "right" };
        if (idx % 2 === 1) {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF9FBFB" },
          };
        }
      });
    }

    // ==========================================
    // SHEET 2: Daily Reports (Rokad Staff)
    // ==========================================
    const sheet2 = workbook.addWorksheet("گزارش‌های روزانه (Rokad)", {
      views: [{ rightToLeft: true }],
    });

    sheet2.columns = [
      { header: "ردیف", key: "rowNum", width: 8 },
      { header: "تاریخ شمسی", key: "dateJalali", width: 16 },
      { header: "ساعت ثبت", key: "time", width: 12 },
      { header: "وضعیت ارسال", key: "statusFa", width: 16 },
      { header: "متن کامل گزارش پایان روز", key: "rawText", width: 65 },
    ];

    const h2 = sheet2.getRow(1);
    h2.font = { name: "Tahoma", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    h2.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF59BBAF" },
    };
    h2.alignment = { vertical: "middle", horizontal: "center" };
    h2.height = 28;

    if (dailyReportsRaw.length === 0) {
      sheet2.addRow({
        rowNum: 1,
        dateJalali: "هیچ گزارش روزانه‌ای در این بازه ثبت نشده است.",
      });
    } else {
      dailyReportsRaw.forEach((rep, idx) => {
        const cleanText = rep.rawText.replace(/^\/report\s*/i, "").trim();
        const row = sheet2.addRow({
          rowNum: idx + 1,
          dateJalali: formatToJalali(rep.reportDate),
          time: formatTehranTime(rep.submittedAt),
          statusFa: rep.status === "on_time" ? "به‌موقع" : "با تأخیر",
          rawText: cleanText,
        });

        row.font = { name: "Tahoma", size: 10 };
        row.alignment = { vertical: "middle", horizontal: "right" };
        if (idx % 2 === 1) {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF9FBFB" },
          };
        }
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const safeEmpName = employee.fullName.replace(/\s+/g, "_");
    const fileName = `unified_report_${safeEmpName}_${fromDateStr}_to_${toDateStr}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(fileName)}"`,
      },
    });
  } catch (error: any) {
    console.error("Unified export error:", error);
    return NextResponse.json({ error: error.message || "Export error" }, { status: 500 });
  }
}
