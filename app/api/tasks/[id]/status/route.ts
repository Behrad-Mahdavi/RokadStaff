import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { tasks, taskAssignees, taskActivityLog, employees } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// PATCH /api/tasks/[id]/status - Update individual task status
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
    const existingTaskResult = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.isDeleted, false)))
      .limit(1);

    if (existingTaskResult.length === 0) {
      return NextResponse.json({ error: "تسک یافت نشد." }, { status: 404 });
    }

    const task = existingTaskResult[0];

    // Only individual tasks have status field
    if (task.projectId) {
      return NextResponse.json(
        { error: "وضعیت تسک‌های پروژه‌ای با جابجایی بین ستون‌های بورد کانبان تغییر می‌کند." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const newStatus = body.status;

    const validStatuses = ["todo", "in_progress", "done", "cancelled"];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: "وضعیت نامعتبر است." }, { status: 400 });
    }

    // Check permission: Admin or one of the Assignees or Creator
    const isAssignee = session.employeeId
      ? (
          await db
            .select()
            .from(taskAssignees)
            .where(
              and(
                eq(taskAssignees.taskId, taskId),
                eq(taskAssignees.employeeId, session.employeeId)
              )
            )
            .limit(1)
        ).length > 0
      : false;

    const isCreator = task.createdBy === session.employeeId;
    const isAdmin = session.role === "admin" || session.role === "supervisor";

    if (!isAdmin && !isAssignee && !isCreator) {
      return NextResponse.json(
        { error: "شما مجاز به تغییر وضعیت این تسک نیستید." },
        { status: 403 }
      );
    }

    let actorId = session.employeeId;
    if (!actorId) {
      const firstEmp: any[] = await db.select().from(employees).limit(1);
      actorId = firstEmp[0]?.id;
    }

    const updateData: any = {
      status: newStatus,
      updatedAt: new Date(),
    };

    if (newStatus === "done") {
      updateData.completedAt = new Date();
    } else {
      updateData.completedAt = null;
    }

    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, taskId))
      .returning();

    // Log status change
    await db.insert(taskActivityLog).values({
      taskId,
      actorId,
      actionType: "status_changed",
      metadata: {
        fromStatus: task.status,
        toStatus: newStatus,
      },
    });

    return NextResponse.json({
      success: true,
      task: updatedTask,
    });
  } catch (error: any) {
    console.error("Update task status error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
