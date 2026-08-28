import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import {
  projects,
  projectMembers,
  boardColumns,
  tasks,
  taskAssignees,
  checklists,
  checklistItems,
  employees,
} from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// GET /api/rotello/projects/[id] - Full Kanban Board Data
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = params.id;
  const db = getDb();

  try {
    // 1. Fetch project
    const projResult = await db
      .select()
      .from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    if (projResult.length === 0) {
      return NextResponse.json({ error: "پروژه یافت نشد." }, { status: 404 });
    }

    const project = projResult[0];

    // 2. Check access
    let userRole = "member";
    if (session.role === "admin") {
      userRole = "owner";
    } else if (session.employeeId) {
      const membership = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, projectId),
            eq(projectMembers.employeeId, session.employeeId)
          )
        )
        .limit(1);

      if (membership.length === 0) {
        return NextResponse.json({ error: "شما عضو این پروژه نیستید." }, { status: 403 });
      }
      userRole = membership[0].role;
    }

    // 3. Fetch project members
    const members: any[] = await db
      .select({
        id: projectMembers.id,
        employeeId: projectMembers.employeeId,
        role: projectMembers.role,
        fullName: employees.fullName,
        department: employees.department,
        position: employees.position,
      })
      .from(projectMembers)
      .innerJoin(employees, eq(projectMembers.employeeId, employees.id))
      .where(eq(projectMembers.projectId, projectId));

    // 4. Fetch columns ordered by position
    const columns: any[] = await db
      .select()
      .from(boardColumns)
      .where(eq(boardColumns.projectId, projectId))
      .orderBy(boardColumns.position);

    // 5. Fetch all active tasks
    const activeTasks: any[] = await db
      .select({
        id: tasks.id,
        projectId: tasks.projectId,
        columnId: tasks.columnId,
        title: tasks.title,
        description: tasks.description,
        deadline: tasks.deadline,
        priority: tasks.priority,
        position: tasks.position,
        createdBy: tasks.createdBy,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), eq(tasks.isDeleted, false)))
      .orderBy(tasks.position);

    const taskIds = activeTasks.map((t) => t.id);

    // 6. Fetch assignees for tasks
    let assigneesByTaskId: Record<string, any[]> = {};
    if (taskIds.length > 0) {
      const allAssignees: any[] = await db
        .select({
          taskId: taskAssignees.taskId,
          employeeId: taskAssignees.employeeId,
          fullName: employees.fullName,
        })
        .from(taskAssignees)
        .innerJoin(employees, eq(taskAssignees.employeeId, employees.id))
        .where(inArray(taskAssignees.taskId, taskIds));

      for (const a of allAssignees) {
        if (!assigneesByTaskId[a.taskId]) assigneesByTaskId[a.taskId] = [];
        assigneesByTaskId[a.taskId].push(a);
      }
    }

    // 7. Fetch checklist progress for tasks
    let checklistProgressByTaskId: Record<string, { total: number; done: number; rate: number }> = {};
    if (taskIds.length > 0) {
      const allChecklists: any[] = await db
        .select({ id: checklists.id, taskId: checklists.taskId })
        .from(checklists)
        .where(inArray(checklists.taskId, taskIds));

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

        // Map checklist to task
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

        // Compute rate
        for (const tId of Object.keys(checklistProgressByTaskId)) {
          const p = checklistProgressByTaskId[tId];
          p.rate = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
        }
      }
    }

    // Enhance tasks
    const enhancedTasks = activeTasks.map((t) => ({
      ...t,
      assignees: assigneesByTaskId[t.id] || [],
      progress: checklistProgressByTaskId[t.id] || null,
    }));

    return NextResponse.json({
      project,
      userRole,
      members,
      columns,
      tasks: enhancedTasks,
    });
  } catch (error: any) {
    console.error("Fetch project board error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

// PATCH /api/rotello/projects/[id] - Update project settings / archive
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = params.id;
  const db = getDb();

  try {
    // Check permission (Manager or Admin)
    if (session.role !== "admin" && session.employeeId) {
      const membership = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, projectId),
            eq(projectMembers.employeeId, session.employeeId),
            eq(projectMembers.role, "manager")
          )
        )
        .limit(1);

      if (membership.length === 0) {
        return NextResponse.json({ error: "فقط مدیر پروژه مجاز به ویرایش است." }, { status: 403 });
      }
    }

    const body = await req.json();
    const updateData: any = { updatedAt: new Date() };

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.description !== undefined) updateData.description = body.description;
    if (body.isArchived !== undefined) updateData.isArchived = body.isArchived;

    const [updated] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, projectId))
      .returning();

    return NextResponse.json({ success: true, project: updated });
  } catch (error: any) {
    console.error("Update project error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
