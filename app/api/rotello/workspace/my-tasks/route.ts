import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import {
  tasks,
  taskAssignees,
  projects,
  boardColumns,
  checklists,
  checklistItems,
  employees,
} from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  try {
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("archived") === "true";

    let targetEmployeeId = session.employeeId;
    if (!targetEmployeeId) {
      // If admin viewing workspace, find first employee or return empty
      const firstEmp: any[] = await db.select().from(employees).limit(1);
      targetEmployeeId = firstEmp[0]?.id;
    }

    if (!targetEmployeeId) {
      return NextResponse.json({
        tasks: { overdue: [], todayOrThisWeek: [], noDeadlineOrLater: [], completedRecently: [] },
        summary: { total: 0, overdue: 0, completed: 0 },
      });
    }

    // 1. Fetch task assignments for this employee
    const assignments: any[] = await db
      .select({
        taskId: taskAssignees.taskId,
        assignedAt: taskAssignees.assignedAt,
      })
      .from(taskAssignees)
      .where(eq(taskAssignees.employeeId, targetEmployeeId));

    const taskIds = assignments.map((a) => a.taskId);

    if (taskIds.length === 0) {
      return NextResponse.json({
        tasks: { overdue: [], todayOrThisWeek: [], noDeadlineOrLater: [], completedRecently: [] },
        summary: { total: 0, overdue: 0, completed: 0 },
      });
    }

    // 2. Fetch tasks with leftJoin for both Project and Individual tasks
    const assignedTasks: any[] = await db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        columnId: tasks.columnId,
        title: tasks.title,
        description: tasks.description,
        deadline: tasks.deadline,
        priority: tasks.priority,
        position: tasks.position,
        status: tasks.status,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        projectName: projects.name,
        isProjectArchived: projects.isArchived,
        columnName: boardColumns.name,
        isDoneColumn: boardColumns.isDoneColumn,
      })
      .from(tasks)
      .leftJoin(projects, eq(tasks.projectId, projects.id))
      .leftJoin(boardColumns, eq(tasks.columnId, boardColumns.id))
      .where(and(inArray(tasks.id, taskIds), eq(tasks.isDeleted, false)))
      .orderBy(desc(tasks.deadline), desc(tasks.createdAt));

    // Filter archived projects if not requested (Decision 5)
    let filteredTasks = assignedTasks.filter((t) => {
      if (t.projectId && t.isProjectArchived && !includeArchived) {
        return false;
      }
      return true;
    });

    // 3. Fetch checklist progress
    let checklistProgressByTaskId: Record<string, { total: number; done: number; rate: number }> = {};
    const validTaskIds = filteredTasks.map((t) => t.id);

    if (validTaskIds.length > 0) {
      const allChecklists: any[] = await db
        .select({ id: checklists.id, taskId: checklists.taskId })
        .from(checklists)
        .where(inArray(checklists.taskId, validTaskIds));

      const checklistIds = allChecklists.map((c) => c.id);

      if (checklistIds.length > 0) {
        const allItems: any[] = await db
          .select({
            id: checklistItems.id,
            checklistId: checklistItems.checklistId,
            isDone: checklistItems.isDone,
          })
          .from(checklistItems)
          .where(inArray(checklistItems.checklistId, checklistIds));

        const taskByChecklistId = new Map(allChecklists.map((c) => [c.id, c.taskId]));

        for (const item of allItems) {
          const tId = taskByChecklistId.get(item.checklistId);
          if (tId) {
            if (!checklistProgressByTaskId[tId]) {
              checklistProgressByTaskId[tId] = { total: 0, done: 0, rate: 0 };
            }
            checklistProgressByTaskId[tId].total++;
            if (item.isDone) checklistProgressByTaskId[tId].done++;
          }
        }

        for (const tId of Object.keys(checklistProgressByTaskId)) {
          const p = checklistProgressByTaskId[tId];
          p.rate = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
        }
      }
    }

    // 4. Group into 4 smart workspace buckets
    const now = new Date();
    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);

    const overdue: any[] = [];
    const todayOrThisWeek: any[] = [];
    const noDeadlineOrLater: any[] = [];
    const completedRecently: any[] = [];

    for (const t of filteredTasks) {
      const progress = checklistProgressByTaskId[t.id] || null;
      const isIndividual = !t.projectId;
      const isDone = isIndividual ? t.status === "done" : Boolean(t.isDoneColumn);

      const enhanced = {
        ...t,
        progress,
        isIndividual,
        projectName: t.projectName || "تسک فردی (مستقل)",
        columnName:
          t.columnName ||
          (t.status === "done"
            ? "انجام‌شده"
            : t.status === "in_progress"
            ? "در حال انجام"
            : t.status === "cancelled"
            ? "لغوشده"
            : "برای انجام"),
      };

      if (t.status === "cancelled") {
        continue;
      }

      if (isDone) {
        completedRecently.push(enhanced);
      } else if (t.deadline && new Date(t.deadline) < now) {
        overdue.push(enhanced);
      } else if (t.deadline && new Date(t.deadline) <= next7Days) {
        todayOrThisWeek.push(enhanced);
      } else {
        noDeadlineOrLater.push(enhanced);
      }
    }

    return NextResponse.json({
      tasks: {
        overdue,
        todayOrThisWeek,
        noDeadlineOrLater,
        completedRecently,
      },
      summary: {
        total: overdue.length + todayOrThisWeek.length + noDeadlineOrLater.length + completedRecently.length,
        overdue: overdue.length,
        thisWeek: todayOrThisWeek.length,
        completed: completedRecently.length,
      },
    });
  } catch (error: any) {
    console.error("Fetch personal workspace error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
