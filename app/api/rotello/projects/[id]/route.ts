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
      const { getMockProjectBoard } = await import("@/lib/mockRotello");
      const mockBoard = getMockProjectBoard(projectId);
      if (mockBoard) {
        return NextResponse.json(mockBoard);
      }
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

    // 4. Fetch all active employees in organization (for easy 1-click assignment)
    const allEmployees: any[] = await db
      .select({
        id: employees.id,
        fullName: employees.fullName,
        department: employees.department,
        position: employees.position,
      })
      .from(employees)
      .where(eq(employees.isActive, true));

    // 5. Fetch columns ordered by position
    const columns: any[] = await db
      .select()
      .from(boardColumns)
      .where(eq(boardColumns.projectId, projectId))
      .orderBy(boardColumns.position);

    // 6. Fetch all active tasks
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

    // 7. Fetch assignees for tasks
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

    // 8. Fetch checklist progress for tasks
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

    // Enhance tasks
    const enhancedTasks = activeTasks.map((t) => ({
      ...t,
      assignees: assigneesByTaskId[t.id] || [],
      progress: checklistProgressByTaskId[t.id] || null,
    }));

    const isAdmin = session.role === "admin" || session.role === "supervisor";

    return NextResponse.json({
      project,
      userRole,
      isAdmin,
      members,
      allEmployees,
      columns,
      tasks: enhancedTasks,
    });
  } catch (error: any) {
    console.warn("Fetch project board DB offline, using mock store:", error);
    const { getMockProjectBoard } = await import("@/lib/mockRotello");
    const mockBoard = getMockProjectBoard(projectId);
    if (mockBoard) {
      return NextResponse.json(mockBoard);
    }
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
    if (body.description !== undefined) updateData.description = body.description ? body.description.trim() : null;
    if (body.isArchived !== undefined) updateData.isArchived = body.isArchived;

    try {
      const [updated] = await db
        .update(projects)
        .set(updateData)
        .where(eq(projects.id, projectId))
        .returning();

      // Also sync with mock store if exists
      const { updateMockProject } = await import("@/lib/mockRotello");
      updateMockProject(projectId, body);

      return NextResponse.json({ success: true, project: updated });
    } catch (dbErr) {
      console.warn("DB update project failed, using mock store:", dbErr);
      const { updateMockProject } = await import("@/lib/mockRotello");
      const updatedMock = updateMockProject(projectId, body);
      if (!updatedMock) {
        return NextResponse.json({ error: "پروژه یافت نشد." }, { status: 404 });
      }
      return NextResponse.json({ success: true, project: updatedMock });
    }
  } catch (error: any) {
    console.error("Update project error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

// DELETE /api/rotello/projects/[id] - Delete project & all its tasks/columns
export async function DELETE(
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
    // Only admin or project manager can delete
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
        return NextResponse.json({ error: "تنها مدیر یا مالک پروژه مجاز به حذف است." }, { status: 403 });
      }
    }

    try {
      // Find all tasks in this project
      const projectTasks = await db
        .select({ id: tasks.id })
        .from(tasks)
        .where(eq(tasks.projectId, projectId));

      const taskIds = projectTasks.map((t: any) => t.id);

      if (taskIds.length > 0) {
        const taskChecklists = await db
          .select({ id: checklists.id })
          .from(checklists)
          .where(inArray(checklists.taskId, taskIds));

        const checklistIds = taskChecklists.map((c: any) => c.id);
        if (checklistIds.length > 0) {
          await db.delete(checklistItems).where(inArray(checklistItems.checklistId, checklistIds));
          await db.delete(checklists).where(inArray(checklists.id, checklistIds));
        }

        await db.delete(taskAssignees).where(inArray(taskAssignees.taskId, taskIds));
        await db.delete(tasks).where(eq(tasks.projectId, projectId));
      }

      await db.delete(boardColumns).where(eq(boardColumns.projectId, projectId));
      await db.delete(projectMembers).where(eq(projectMembers.projectId, projectId));
      await db.delete(projects).where(eq(projects.id, projectId));

      // Also delete from mock store if present
      const { deleteMockProject } = await import("@/lib/mockRotello");
      deleteMockProject(projectId);

      return NextResponse.json({ success: true, message: "پروژه با موفقیت حذف شد." });
    } catch (dbErr) {
      console.warn("DB delete project failed, using mock store:", dbErr);
      const { deleteMockProject } = await import("@/lib/mockRotello");
      const deleted = deleteMockProject(projectId);
      if (!deleted) {
        return NextResponse.json({ error: "پروژه یافت نشد." }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: "پروژه با موفقیت حذف شد." });
    }
  } catch (error: any) {
    console.error("Delete project error:", error);
    return NextResponse.json({ error: error.message || "خطای سرور" }, { status: 500 });
  }
}
