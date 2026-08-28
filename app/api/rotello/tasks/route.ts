import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import {
  tasks,
  boardColumns,
  projectMembers,
  taskAssignees,
  taskActivityLog,
  employees,
  projects,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { notifyService } from "@/lib/telegram/notify";
import { formatToJalali } from "@/lib/utils";

// POST /api/rotello/tasks - Create new task
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();

  try {
    const body = await req.json();
    const {
      projectId,
      columnId,
      title,
      description,
      deadline,
      priority = "normal",
      assigneeIds = [],
    } = body;

    if (!projectId || !title?.trim()) {
      return NextResponse.json(
        { error: "شناسه پروژه و عنوان تسک الزامی است." },
        { status: 400 }
      );
    }

    // Determine creator employee id
    let creatorId = session.employeeId;
    if (!creatorId) {
      const firstEmp: any[] = await db.select().from(employees).limit(1);
      creatorId = firstEmp[0]?.id;
    }

    // Check project membership (Any member can create a task - Decision 3)
    if (session.role !== "admin" && session.employeeId) {
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
        return NextResponse.json(
          { error: "شما عضو این پروژه نیستید و دسترسی به ثبت تسک ندارید." },
          { status: 403 }
        );
      }
    }

    // Find target column
    let targetColumnId = columnId;
    if (!targetColumnId) {
      const firstCol: any[] = await db
        .select()
        .from(boardColumns)
        .where(eq(boardColumns.projectId, projectId))
        .orderBy(boardColumns.position)
        .limit(1);

      if (firstCol.length === 0) {
        return NextResponse.json(
          { error: "پروژه هنوز هیچ ستونی برای قرارگیری تسک ندارد." },
          { status: 400 }
        );
      }
      targetColumnId = firstCol[0].id;
    }

    // Calculate position (last + 1000)
    const lastTask: any[] = await db
      .select({ position: tasks.position })
      .from(tasks)
      .where(and(eq(tasks.columnId, targetColumnId), eq(tasks.isDeleted, false)))
      .orderBy(desc(tasks.position))
      .limit(1);

    const position = lastTask.length > 0 ? lastTask[0].position + 1000 : 1000;

    // 1. Insert Task
    const [newTask] = await db
      .insert(tasks)
      .values({
        projectId,
        columnId: targetColumnId,
        title: title.trim(),
        description: description?.trim() || null,
        deadline: deadline ? new Date(deadline) : null,
        priority,
        position,
        createdBy: creatorId,
        isDeleted: false,
      })
      .returning();

    // 2. Add Assignees
    if (Array.isArray(assigneeIds) && assigneeIds.length > 0) {
      for (const empId of assigneeIds) {
        await db.insert(taskAssignees).values({
          taskId: newTask.id,
          employeeId: empId,
          assignedBy: creatorId,
        });
      }

      // 3. Send Telegram Notifications to Assignees
      const projInfo: any[] = await db
        .select({ name: projects.name })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

      const projectName = projInfo[0]?.name || "پروژه";
      const creatorName = session.fullName || "مدیر پروژه";
      const deadlineJalali = deadline ? formatToJalali(new Date(deadline)) : undefined;

      for (const empId of assigneeIds) {
        const empResult: any[] = await db
          .select()
          .from(employees)
          .where(eq(employees.id, empId))
          .limit(1);

        if (empResult[0]?.telegramChatId) {
          notifyService.sendTaskAssigned(
            Number(empResult[0].telegramChatId),
            empResult[0].fullName,
            newTask.title,
            projectName,
            creatorName,
            deadlineJalali
          );
        }
      }
    }

    // 4. Log creation in task_activity_log
    await db.insert(taskActivityLog).values({
      taskId: newTask.id,
      actorId: creatorId,
      actionType: "created",
      metadata: {
        title: newTask.title,
        priority: newTask.priority,
        assigneeCount: assigneeIds.length,
      },
    });

    return NextResponse.json({
      success: true,
      task: newTask,
    });
  } catch (error: any) {
    console.error("Create task error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
