import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import {
  tasks,
  boardColumns,
  projects,
  taskAssignees,
  employees,
} from "@/lib/db/schema";
import { eq, and, sql, isNotNull, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  try {
    const now = new Date();

    // 1. Fetch all active projects and tasks with column status
    const allActiveTasks: any[] = await db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        priority: tasks.priority,
        deadline: tasks.deadline,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
        isDoneColumn: boardColumns.isDoneColumn,
      })
      .from(tasks)
      .innerJoin(boardColumns, eq(tasks.columnId, boardColumns.id))
      .innerJoin(projects, eq(tasks.projectId, projects.id))
      .where(and(eq(tasks.isDeleted, false), eq(projects.isArchived, false)));

    // 2. Open Tasks by Priority
    const openTasks = allActiveTasks.filter((t) => !t.isDoneColumn);
    const completedTasks = allActiveTasks.filter((t) => t.isDoneColumn);

    const openByPriority = {
      urgent: openTasks.filter((t) => t.priority === "urgent").length,
      important: openTasks.filter((t) => t.priority === "important").length,
      normal: openTasks.filter((t) => t.priority === "normal").length,
    };

    // 3. Overdue Tasks
    const overdueCount = openTasks.filter(
      (t) => t.deadline && new Date(t.deadline) < now
    ).length;

    // 4. Workload Distribution per Employee
    const openTaskIds = openTasks.map((t) => t.id);
    let workloadMap: Record<string, { employeeId: string; fullName: string; department: string; count: number }> = {};

    if (openTaskIds.length > 0) {
      const activeAssignments: any[] = await db
        .select({
          employeeId: taskAssignees.employeeId,
          fullName: employees.fullName,
          department: employees.department,
        })
        .from(taskAssignees)
        .innerJoin(employees, eq(taskAssignees.employeeId, employees.id))
        .where(inArray(taskAssignees.taskId, openTaskIds));

      for (const a of activeAssignments) {
        if (!workloadMap[a.employeeId]) {
          workloadMap[a.employeeId] = {
            employeeId: a.employeeId,
            fullName: a.fullName,
            department: a.department || "پسرانه",
            count: 0,
          };
        }
        workloadMap[a.employeeId].count++;
      }
    }

    const workloadList = Object.values(workloadMap).sort((a, b) => b.count - a.count);

    // 5. Average Completion Cycle Time
    const cycleTimes = completedTasks
      .filter((t) => t.completedAt && t.createdAt)
      .map(
        (t) =>
          (new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime()) /
          (1000 * 3600 * 24)
      );

    const avgCycleDays =
      cycleTimes.length > 0
        ? Math.round(
            (cycleTimes.reduce((a, b) => a + b, 0) / cycleTimes.length) * 10
          ) / 10
        : 0;

    return NextResponse.json({
      summary: {
        totalOpen: openTasks.length,
        totalCompleted: completedTasks.length,
        overdueCount,
        avgCycleDays,
      },
      openByPriority,
      workload: workloadList,
    });
  } catch (error: any) {
    console.error("Fetch Rotello summary error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
