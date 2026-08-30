import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import {
  tasks,
  taskAssignees,
  taskActivityLog,
  employees,
  checklists,
  checklistItems,
} from "@/lib/db/schema";
import { eq, and, desc, inArray, isNull, or, ilike } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { notifyService } from "@/lib/telegram/notify";
import { formatToJalali } from "@/lib/utils";

// GET /api/individual-tasks - List individual standalone tasks
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const assigneeId = searchParams.get("assignee");
  const status = searchParams.get("status");
  const search = searchParams.get("search")?.trim();

  const db = getDb();

  try {
    // 1. Fetch individual tasks (projectId is null)
    let query = db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        deadline: tasks.deadline,
        priority: tasks.priority,
        status: tasks.status,
        createdBy: tasks.createdBy,
        completedAt: tasks.completedAt,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .where(and(isNull(tasks.projectId), eq(tasks.isDeleted, false)))
      .orderBy(desc(tasks.createdAt));

    let allIndividualTasks: any[] = await query;

    // Apply status filter
    if (status && status !== "all") {
      allIndividualTasks = allIndividualTasks.filter((t) => t.status === status);
    }

    // Apply search filter
    if (search) {
      allIndividualTasks = allIndividualTasks.filter(
        (t) =>
          t.title.toLowerCase().includes(search.toLowerCase()) ||
          (t.description && t.description.toLowerCase().includes(search.toLowerCase()))
      );
    }

    const taskIds = allIndividualTasks.map((t) => t.id);

    // 2. Fetch assignees for these tasks
    let assigneesByTaskId: Record<string, any[]> = {};
    if (taskIds.length > 0) {
      const allAssignees: any[] = await db
        .select({
          taskId: taskAssignees.taskId,
          employeeId: taskAssignees.employeeId,
          fullName: employees.fullName,
          department: employees.department,
        })
        .from(taskAssignees)
        .innerJoin(employees, eq(taskAssignees.employeeId, employees.id))
        .where(inArray(taskAssignees.taskId, taskIds));

      for (const a of allAssignees) {
        if (!assigneesByTaskId[a.taskId]) assigneesByTaskId[a.taskId] = [];
        assigneesByTaskId[a.taskId].push(a);
      }
    }

    // Filter by assignee if requested
    let filteredTasks = allIndividualTasks.map((t) => ({
      ...t,
      assignees: assigneesByTaskId[t.id] || [],
    }));

    if (assigneeId && assigneeId !== "all") {
      filteredTasks = filteredTasks.filter((t) =>
        t.assignees.some((a: any) => a.employeeId === assigneeId)
      );
    }

    // If employee role, only see tasks assigned to them or created by them
    if (session.role === "employee" && session.employeeId) {
      filteredTasks = filteredTasks.filter(
        (t) =>
          t.createdBy === session.employeeId ||
          t.assignees.some((a: any) => a.employeeId === session.employeeId)
      );
    }

    return NextResponse.json({ tasks: filteredTasks });
  } catch (error: any) {
    console.error("List individual tasks error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

// POST /api/individual-tasks - Create an individual standalone task
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only Admin or Supervisor can create individual direct tasks
  if (session.role === "employee") {
    return NextResponse.json(
      { error: "فقط مدیران و سرپرستان سیستم مجاز به ایجاد تسک‌های فردی هستند." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const title = body.title?.trim();
    const description = body.description?.trim() || null;
    const priority = body.priority || "normal";
    const deadline = body.deadline ? new Date(body.deadline) : null;
    const assigneeIds: string[] = Array.isArray(body.assigneeIds) ? body.assigneeIds : [];

    if (!title) {
      return NextResponse.json({ error: "عنوان تسک الزامی است." }, { status: 400 });
    }

    if (assigneeIds.length === 0) {
      return NextResponse.json(
        { error: "حداقل باید یک همکار مسئول برای تسک فردی انتخاب شود." },
        { status: 400 }
      );
    }

    const db = getDb();

    // Determine creator ID
    let creatorId = session.employeeId;
    if (!creatorId) {
      const firstEmp: any[] = await db.select().from(employees).limit(1);
      creatorId = firstEmp[0]?.id;
    }

    if (!creatorId) {
      return NextResponse.json(
        { error: "هیچ کارمندی برای انتساب ثبت‌کننده در سیستم یافت نشد." },
        { status: 400 }
      );
    }

    // 1. Create task (projectId = null, columnId = null, status = 'todo')
    const [newTask] = await db
      .insert(tasks)
      .values({
        projectId: null,
        columnId: null,
        title,
        description,
        deadline,
        priority,
        status: "todo",
        createdBy: creatorId,
        isDeleted: false,
      })
      .returning();

    // 2. Assign employees
    const deadlineJalali = deadline ? formatToJalali(deadline) : undefined;
    const creatorName = session.fullName || "مدیریت";

    for (const empId of assigneeIds) {
      await db.insert(taskAssignees).values({
        taskId: newTask.id,
        employeeId: empId,
        assignedBy: creatorId,
      });

      // Send Telegram notification
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
          "تسک مستقیم فردی",
          creatorName,
          deadlineJalali
        );
      }
    }

    // 3. Log activity
    await db.insert(taskActivityLog).values({
      taskId: newTask.id,
      actorId: creatorId,
      actionType: "created",
      metadata: {
        type: "individual",
        assigneeCount: assigneeIds.length,
      },
    });

    return NextResponse.json({
      success: true,
      task: newTask,
    });
  } catch (error: any) {
    console.error("Create individual task error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
