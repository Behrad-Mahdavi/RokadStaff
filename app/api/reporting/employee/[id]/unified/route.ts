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
import { eq, and, desc, inArray, gte, lte, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// GET /api/reporting/employee/[id]/unified?from=YYYY-MM-DD&to=YYYY-MM-DD
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
    // 1. Fetch employee info
    const empResult: any[] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    if (empResult.length === 0) {
      return NextResponse.json({ error: "کارمند یافت نشد." }, { status: 404 });
    }

    const employee = empResult[0];

    // Department Scope Check (Supervisor can only see their own department)
    if (
      session.role === "supervisor" &&
      session.department &&
      employee.department !== session.department
    ) {
      return NextResponse.json(
        { error: "شما فقط به گزارش کارکنان دپارتمان خود دسترسی دارید." },
        { status: 403 }
      );
    }

    // Default to last 30 days if from/to not provided
    const toDate = toParam ? new Date(toParam + "T23:59:59.999Z") : new Date();
    const fromDate = fromParam
      ? new Date(fromParam + "T00:00:00.000Z")
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const fromDateStr = fromDate.toISOString().split("T")[0];
    const toDateStr = toDate.toISOString().split("T")[0];
    const now = new Date();

    // ==============================================================
    // BLOCK A: Current Tasks Snapshot (Live Status, Open Tasks)
    // ==============================================================
    const activeAssignments: any[] = await db
      .select({ taskId: taskAssignees.taskId })
      .from(taskAssignees)
      .where(eq(taskAssignees.employeeId, employeeId));

    const assignedTaskIds = activeAssignments.map((a) => a.taskId);

    let currentOpenTasks: any[] = [];
    if (assignedTaskIds.length > 0) {
      const openTasksRaw: any[] = await db
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
        .orderBy(desc(tasks.deadline), desc(tasks.createdAt));

      currentOpenTasks = openTasksRaw.filter((t) => {
        if (t.projectId) {
          return !t.isDoneColumn;
        } else {
          return t.status === "todo" || t.status === "in_progress";
        }
      });
    }

    const totalOpen = currentOpenTasks.length;
    const overdueTasks = currentOpenTasks.filter(
      (t) => t.deadline && new Date(t.deadline) < now
    );
    const urgentTasks = currentOpenTasks.filter((t) => t.priority === "urgent");
    const importantTasks = currentOpenTasks.filter((t) => t.priority === "important");
    const normalTasks = currentOpenTasks.filter((t) => t.priority === "normal");

    const currentTasksSnapshot = {
      totalOpen,
      overdueCount: overdueTasks.length,
      priorityBreakdown: {
        urgent: urgentTasks.length,
        important: importantTasks.length,
        normal: normalTasks.length,
      },
      openTasks: currentOpenTasks.map((t) => ({
        id: t.id,
        title: t.title,
        type: t.projectId ? "project" : "individual",
        projectName: t.projectName || "تسک فردی (مستقل)",
        statusOrColumn: t.projectName ? t.columnName : t.status === "in_progress" ? "در حال انجام" : "برای انجام",
        priority: t.priority,
        deadline: t.deadline,
        isOverdue: t.deadline ? new Date(t.deadline) < now : false,
      })),
    };

    // ==============================================================
    // BLOCK B: Rotello Activity in Date Range
    // ==============================================================
    let completedTasksInRange: any[] = [];
    if (assignedTaskIds.length > 0) {
      completedTasksInRange = await db
        .select({
          id: tasks.id,
          title: tasks.title,
          priority: tasks.priority,
          completedAt: tasks.completedAt,
          projectName: projects.name,
        })
        .from(tasks)
        .leftJoin(projects, eq(tasks.projectId, projects.id))
        .where(
          and(
            inArray(tasks.id, assignedTaskIds),
            eq(tasks.isDeleted, false),
            gte(tasks.completedAt, fromDate),
            lte(tasks.completedAt, toDate)
          )
        )
        .orderBy(desc(tasks.completedAt));
    }

    // Task Reports submitted by this employee
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

    // Checklist items checked by this employee
    const checkedItemsInRange = await db
      .select({
        id: checklistItems.id,
        title: checklistItems.title,
        doneAt: checklistItems.doneAt,
        checklistTitle: checklists.title,
        taskId: checklists.taskId,
        taskTitle: tasks.title,
        projectName: projects.name,
      })
      .from(checklistItems)
      .innerJoin(checklists, eq(checklistItems.checklistId, checklists.id))
      .innerJoin(tasks, eq(checklists.taskId, tasks.id))
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .where(
        and(
          eq(checklistItems.doneBy, employeeId),
          gte(checklistItems.doneAt, fromDate),
          lte(checklistItems.doneAt, toDate),
          eq(tasks.isDeleted, false)
        )
      )
      .orderBy(desc(checklistItems.doneAt));

    const rotelloActivity = {
      completedTasksCount: completedTasksInRange.length,
      completedTasks: completedTasksInRange,
      taskReportsCount: taskReportsInRange.length,
      taskReports: taskReportsInRange,
      checklistDoneCount: checkedItemsInRange.length,
      checklistDoneItems: checkedItemsInRange,
    };

    // ==============================================================
    // BLOCK C: Daily Reports Activity (Rokad Staff)
    // ==============================================================
    const dailyReportsRaw: any[] = await db
      .select({
        id: dailyReports.id,
        reportDate: dailyReports.reportDate,
        submittedAt: dailyReports.submittedAt,
        status: dailyReports.status,
        rawText: dailyReports.rawText,
      })
      .from(dailyReports)
      .where(
        and(
          eq(dailyReports.employeeId, employeeId),
          gte(dailyReports.reportDate, fromDateStr),
          lte(dailyReports.reportDate, toDateStr)
        )
      )
      .orderBy(desc(dailyReports.reportDate));

    // Fetch report items for these daily reports
    const reportIds = dailyReportsRaw.map((r) => r.id);
    let itemsByReportId: Record<string, any[]> = {};
    if (reportIds.length > 0) {
      const allReportItems = await db
        .select()
        .from(reportItems)
        .where(inArray(reportItems.reportId, reportIds))
        .orderBy(reportItems.taskOrder);

      for (const item of allReportItems) {
        if (!itemsByReportId[item.reportId]) itemsByReportId[item.reportId] = [];
        itemsByReportId[item.reportId].push(item);
      }
    }

    const enhancedDailyReports = dailyReportsRaw.map((r) => ({
      ...r,
      isOnTime: r.status === "on_time",
      items: itemsByReportId[r.id] || [],
    }));

    const totalSubmitted = enhancedDailyReports.length;
    const onTimeCount = enhancedDailyReports.filter((r) => r.isOnTime).length;
    const lateCount = totalSubmitted - onTimeCount;
    const onTimeRate = totalSubmitted > 0 ? Math.round((onTimeCount / totalSubmitted) * 100) : 0;

    // Calculate missing days (Workdays with no report)
    const reportedDates = new Set(dailyReportsRaw.map((r) => r.reportDate));
    const missingDates: string[] = [];
    const curr = new Date(fromDate);
    const end = new Date(toDate > now ? now : toDate);

    while (curr <= end) {
      const dStr = curr.toISOString().split("T")[0];
      // Exclude Friday (day 5 in JS Date UTC is Friday depending on timezone)
      // Iran workday is Saturday (6) to Thursday (4)
      const dayOfWeek = curr.getUTCDay();
      const isFriday = dayOfWeek === 5;

      if (!isFriday && !reportedDates.has(dStr)) {
        missingDates.push(dStr);
      }
      curr.setDate(curr.getDate() + 1);
    }

    const dailyReportsActivity = {
      totalSubmitted,
      onTimeCount,
      lateCount,
      onTimeRate,
      missingDatesCount: missingDates.length,
      missingDates,
      reports: enhancedDailyReports,
    };

    return NextResponse.json({
      employee: {
        id: employee.id,
        fullName: employee.fullName,
        department: employee.department,
        position: employee.position,
        role: employee.role,
        telegramUsername: employee.telegramUsername,
      },
      range: {
        from: fromDateStr,
        to: toDateStr,
      },
      currentTasksSnapshot,
      rotelloActivity,
      dailyReportsActivity,
    });
  } catch (error: any) {
    console.error("Unified individual report error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
