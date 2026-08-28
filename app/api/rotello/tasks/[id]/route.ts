import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import {
  tasks,
  boardColumns,
  projectMembers,
  taskAssignees,
  checklists,
  checklistItems,
  taskActivityLog,
  employees,
} from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// GET /api/rotello/tasks/[id] - Full details of a task
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const taskId = params.id;
  const db = getDb();

  try {
    const taskResult: any[] = await db
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
        isDeleted: tasks.isDeleted,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        columnName: boardColumns.name,
        isDoneColumn: boardColumns.isDoneColumn,
        creatorName: employees.fullName,
      })
      .from(tasks)
      .innerJoin(boardColumns, eq(tasks.columnId, boardColumns.id))
      .leftJoin(employees, eq(tasks.createdBy, employees.id))
      .where(and(eq(tasks.id, taskId), eq(tasks.isDeleted, false)))
      .limit(1);

    if (taskResult.length === 0) {
      return NextResponse.json({ error: "تسک یافت نشد یا حذف شده است." }, { status: 404 });
    }

    const task = taskResult[0];

    // 1. Fetch Assignees
    const assignees: any[] = await db
      .select({
        id: taskAssignees.id,
        employeeId: taskAssignees.employeeId,
        fullName: employees.fullName,
        department: employees.department,
        position: employees.position,
        assignedAt: taskAssignees.assignedAt,
      })
      .from(taskAssignees)
      .innerJoin(employees, eq(taskAssignees.employeeId, employees.id))
      .where(eq(taskAssignees.taskId, taskId));

    // 2. Fetch Checklists & Checklist Items
    const taskChecklists: any[] = await db
      .select()
      .from(checklists)
      .where(eq(checklists.taskId, taskId))
      .orderBy(checklists.position);

    const checklistIds = taskChecklists.map((c) => c.id);
    let itemsByChecklistId: Record<string, any[]> = {};

    if (checklistIds.length > 0) {
      const allItems: any[] = await db
        .select({
          id: checklistItems.id,
          checklistId: checklistItems.checklistId,
          title: checklistItems.title,
          position: checklistItems.position,
          isDone: checklistItems.isDone,
          doneBy: checklistItems.doneBy,
          doneAt: checklistItems.doneAt,
          doneByName: employees.fullName,
        })
        .from(checklistItems)
        .leftJoin(employees, eq(checklistItems.doneBy, employees.id))
        .where(inArray(checklistItems.checklistId, checklistIds))
        .orderBy(checklistItems.position);

      for (const item of allItems) {
        if (!itemsByChecklistId[item.checklistId]) {
          itemsByChecklistId[item.checklistId] = [];
        }
        itemsByChecklistId[item.checklistId].push(item);
      }
    }

    const enhancedChecklists = taskChecklists.map((c) => ({
      ...c,
      items: itemsByChecklistId[c.id] || [],
    }));

    // 3. Check user permissions on this task
    let isManager = session.role === "admin";
    if (!isManager && session.employeeId) {
      const membership = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, task.projectId),
            eq(projectMembers.employeeId, session.employeeId),
            eq(projectMembers.role, "manager")
          )
        )
        .limit(1);

      isManager = membership.length > 0;
    }

    const isAssignee = assignees.some((a) => a.employeeId === session.employeeId);
    const isCreator = task.createdBy === session.employeeId;

    return NextResponse.json({
      task,
      assignees,
      checklists: enhancedChecklists,
      permissions: {
        canEdit: isManager || isCreator,
        canDelete: isManager,
        canCheckItems: isManager || isAssignee,
        canReport: isManager || isAssignee || isCreator,
      },
    });
  } catch (error: any) {
    console.error("Fetch task details error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

// PATCH /api/rotello/tasks/[id] - Update task (Drag & Drop or Field Edits)
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const taskId = params.id;
  const db = getDb();

  try {
    const existingTaskResult: any[] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.isDeleted, false)))
      .limit(1);

    if (existingTaskResult.length === 0) {
      return NextResponse.json({ error: "تسک یافت نشد." }, { status: 404 });
    }

    const existingTask = existingTaskResult[0];

    // Determine current user ID
    let actorId = session.employeeId;
    if (!actorId) {
      const firstEmp: any[] = await db.select().from(employees).limit(1);
      actorId = firstEmp[0]?.id;
    }

    const body = await req.json();
    const updateData: any = { updatedAt: new Date() };

    // Case A: Drag & Drop (Column Move or Re-ordering)
    if (body.columnId !== undefined || body.position !== undefined) {
      const targetColumnId = body.columnId || existingTask.columnId;
      const targetPosition = body.position !== undefined ? Number(body.position) : existingTask.position;

      updateData.columnId = targetColumnId;
      updateData.position = targetPosition;

      // Check if target column is a Done column
      const targetColInfo: any[] = await db
        .select()
        .from(boardColumns)
        .where(eq(boardColumns.id, targetColumnId))
        .limit(1);

      if (targetColInfo.length > 0 && targetColInfo[0].isDoneColumn) {
        updateData.completedAt = new Date();
      } else if (targetColInfo.length > 0 && !targetColInfo[0].isDoneColumn) {
        updateData.completedAt = null;
      }

      const [updatedTask] = await db
        .update(tasks)
        .set(updateData)
        .where(eq(tasks.id, taskId))
        .returning();

      // Log movement if column changed
      if (body.columnId && body.columnId !== existingTask.columnId) {
        await db.insert(taskActivityLog).values({
          taskId,
          actorId,
          actionType: "moved_column",
          metadata: {
            fromColumnId: existingTask.columnId,
            toColumnId: targetColumnId,
            toColumnName: targetColInfo[0]?.name || "ستون جدید",
          },
        });
      }

      return NextResponse.json({ success: true, task: updatedTask });
    }

    // Case B: Field Edits (Title, Description, Priority, Deadline)
    // Permission check: Manager, Admin, or Task Creator
    let isManager = session.role === "admin";
    if (!isManager && session.employeeId) {
      const membership = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, existingTask.projectId),
            eq(projectMembers.employeeId, session.employeeId),
            eq(projectMembers.role, "manager")
          )
        )
        .limit(1);

      isManager = membership.length > 0;
    }

    if (!isManager && existingTask.createdBy !== session.employeeId) {
      return NextResponse.json(
        { error: "شما دسترسی ویرایش جزئیات این تسک را ندارید." },
        { status: 403 }
      );
    }

    const changedFields: string[] = [];

    if (body.title !== undefined && body.title.trim() !== existingTask.title) {
      updateData.title = body.title.trim();
      changedFields.push("عنوان");
    }
    if (body.description !== undefined && body.description !== existingTask.description) {
      updateData.description = body.description;
      changedFields.push("توضیحات");
    }
    if (body.priority !== undefined && body.priority !== existingTask.priority) {
      updateData.priority = body.priority;
      changedFields.push("اولویت");
    }
    if (body.deadline !== undefined) {
      updateData.deadline = body.deadline ? new Date(body.deadline) : null;
      changedFields.push("ددلاین");
    }

    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, taskId))
      .returning();

    // Log edit activity
    if (changedFields.length > 0) {
      await db.insert(taskActivityLog).values({
        taskId,
        actorId,
        actionType: "edited",
        metadata: {
          changedFields,
        },
      });
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error: any) {
    console.error("Update task error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

// DELETE /api/rotello/tasks/[id] - Soft Delete Task
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const taskId = params.id;
  const db = getDb();

  try {
    const existingTaskResult: any[] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.isDeleted, false)))
      .limit(1);

    if (existingTaskResult.length === 0) {
      return NextResponse.json({ error: "تسک یافت نشد." }, { status: 404 });
    }

    const existingTask = existingTaskResult[0];

    // Check permission (Manager or Admin)
    let isManager = session.role === "admin";
    if (!isManager && session.employeeId) {
      const membership = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, existingTask.projectId),
            eq(projectMembers.employeeId, session.employeeId),
            eq(projectMembers.role, "manager")
          )
        )
        .limit(1);

      isManager = membership.length > 0;
    }

    if (!isManager) {
      return NextResponse.json(
        { error: "فقط مدیر پروژه یا ادمین مجاز به حذف تسک هستند." },
        { status: 403 }
      );
    }

    let actorId = session.employeeId;
    if (!actorId) {
      const firstEmp: any[] = await db.select().from(employees).limit(1);
      actorId = firstEmp[0]?.id;
    }

    // Perform Soft Delete
    await db
      .update(tasks)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: actorId,
      })
      .where(eq(tasks.id, taskId));

    // Log deletion activity
    await db.insert(taskActivityLog).values({
      taskId,
      actorId,
      actionType: "deleted",
      metadata: {
        title: existingTask.title,
      },
    });

    return NextResponse.json({
      success: true,
      message: "تسک با موفقیت حذف شد.",
    });
  } catch (error: any) {
    console.error("Delete task error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
