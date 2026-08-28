import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import {
  tasks,
  taskAssignees,
  taskActivityLog,
  employees,
  projects,
  projectMembers,
} from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { notifyService } from "@/lib/telegram/notify";
import { formatToJalali } from "@/lib/utils";

export async function POST(
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
    const taskResult = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.isDeleted, false)))
      .limit(1);

    if (taskResult.length === 0) {
      return NextResponse.json({ error: "تسک یافت نشد." }, { status: 404 });
    }

    const task = taskResult[0];

    const body = await req.json();
    const newAssigneeIds: string[] = Array.isArray(body.assigneeIds)
      ? body.assigneeIds
      : [];

    let actorId = session.employeeId;
    if (!actorId) {
      const firstEmp: any[] = await db.select().from(employees).limit(1);
      actorId = firstEmp[0]?.id;
    }

    // 1. Get current assignees
    const currentAssignees: any[] = await db
      .select()
      .from(taskAssignees)
      .where(eq(taskAssignees.taskId, taskId));

    const currentIds = currentAssignees.map((a: any) => a.employeeId);

    const toAdd = newAssigneeIds.filter((id) => !currentIds.includes(id));
    const toRemove = currentIds.filter((id) => !newAssigneeIds.includes(id));

    // 2. Remove unassigned
    if (toRemove.length > 0) {
      for (const empId of toRemove) {
        await db
          .delete(taskAssignees)
          .where(
            and(
              eq(taskAssignees.taskId, taskId),
              eq(taskAssignees.employeeId, empId)
            )
          );

        await db.insert(taskActivityLog).values({
          taskId,
          actorId,
          actionType: "assignee_removed",
          metadata: { employeeId: empId },
        });
      }
    }

    // 3. Insert newly assigned (and auto-add to project_members if not yet member)
    if (toAdd.length > 0) {
      const projInfo: any[] = await db
        .select({ name: projects.name })
        .from(projects)
        .where(eq(projects.id, task.projectId))
        .limit(1);

      const projectName = projInfo[0]?.name || "پروژه";
      const deadlineJalali = task.deadline ? formatToJalali(new Date(task.deadline)) : undefined;
      const creatorName = session.fullName || "مدیر پروژه";

      for (const empId of toAdd) {
        // Ensure employee is in project_members
        const existingMember = await db
          .select()
          .from(projectMembers)
          .where(
            and(
              eq(projectMembers.projectId, task.projectId),
              eq(projectMembers.employeeId, empId)
            )
          )
          .limit(1);

        if (existingMember.length === 0) {
          await db.insert(projectMembers).values({
            projectId: task.projectId,
            employeeId: empId,
            role: "member",
          });
        }

        await db.insert(taskAssignees).values({
          taskId,
          employeeId: empId,
          assignedBy: actorId,
        });

        await db.insert(taskActivityLog).values({
          taskId,
          actorId,
          actionType: "assignee_added",
          metadata: { employeeId: empId },
        });

        // Send Telegram alert
        const empResult: any[] = await db
          .select()
          .from(employees)
          .where(eq(employees.id, empId))
          .limit(1);

        if (empResult[0]?.telegramChatId) {
          notifyService.sendTaskAssigned(
            Number(empResult[0].telegramChatId),
            empResult[0].fullName,
            task.title,
            projectName,
            creatorName,
            deadlineJalali
          );
        }
      }
    }

    // Return updated assignees
    const updatedAssignees: any[] = await db
      .select({
        id: taskAssignees.id,
        employeeId: taskAssignees.employeeId,
        fullName: employees.fullName,
      })
      .from(taskAssignees)
      .innerJoin(employees, eq(taskAssignees.employeeId, employees.id))
      .where(eq(taskAssignees.taskId, taskId));

    return NextResponse.json({
      success: true,
      assignees: updatedAssignees,
    });
  } catch (error: any) {
    console.error("Update assignees error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
