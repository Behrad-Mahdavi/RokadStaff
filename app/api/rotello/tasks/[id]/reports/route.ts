import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import {
  taskReports,
  taskActivityLog,
  employees,
  tasks,
  projectMembers,
  taskAssignees,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// GET /api/rotello/tasks/[id]/reports - Combined Narrative Reports & Activity Stream
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
    // 1. Fetch Narrative Reports
    const reports: any[] = await db
      .select({
        id: taskReports.id,
        content: taskReports.content,
        createdAt: taskReports.createdAt,
        authorId: taskReports.authorId,
        authorName: employees.fullName,
        authorDepartment: employees.department,
        authorPosition: employees.position,
      })
      .from(taskReports)
      .innerJoin(employees, eq(taskReports.authorId, employees.id))
      .where(eq(taskReports.taskId, taskId))
      .orderBy(desc(taskReports.createdAt));

    // 2. Fetch System Activity Logs
    const activities: any[] = await db
      .select({
        id: taskActivityLog.id,
        actionType: taskActivityLog.actionType,
        metadata: taskActivityLog.metadata,
        createdAt: taskActivityLog.createdAt,
        actorId: taskActivityLog.actorId,
        actorName: employees.fullName,
      })
      .from(taskActivityLog)
      .innerJoin(employees, eq(taskActivityLog.actorId, employees.id))
      .where(eq(taskActivityLog.taskId, taskId))
      .orderBy(desc(taskActivityLog.createdAt));

    // 3. Format into unified timeline stream
    const timelineItems = [
      ...reports.map((r) => ({
        type: "report" as const,
        id: r.id,
        content: r.content,
        authorName: r.authorName,
        authorDepartment: r.authorDepartment,
        authorPosition: r.authorPosition,
        createdAt: r.createdAt,
      })),
      ...activities.map((a) => ({
        type: "activity" as const,
        id: a.id,
        actionType: a.actionType,
        metadata: a.metadata,
        actorName: a.actorName,
        createdAt: a.createdAt,
      })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      reports,
      activities,
      timeline: timelineItems,
    });
  } catch (error: any) {
    console.error("Fetch task reports error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

// POST /api/rotello/tasks/[id]/reports - Append-only Report Submission
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
    const body = await req.json();
    const content = body.content?.trim();

    if (!content || content.length < 2) {
      return NextResponse.json(
        { error: "متن گزارش کار باید حداقل ۲ کاراکتر باشد." },
        { status: 400 }
      );
    }

    // Determine author ID securely from Session
    let authorId = session.employeeId;
    if (!authorId) {
      const firstEmp: any[] = await db.select().from(employees).limit(1);
      authorId = firstEmp[0]?.id;
    }

    if (!authorId) {
      return NextResponse.json(
        { error: "کاربر ثبت‌کننده نامعتبر است." },
        { status: 403 }
      );
    }

    // Verify task exists
    const taskResult: any[] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.isDeleted, false)))
      .limit(1);

    if (taskResult.length === 0) {
      return NextResponse.json({ error: "تسک یافت نشد." }, { status: 404 });
    }

    // Insert Append-only Report
    const [newReport] = await db
      .insert(taskReports)
      .values({
        taskId,
        authorId,
        content,
      })
      .returning();

    // Fetch author details
    const authorInfo: any[] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, authorId))
      .limit(1);

    return NextResponse.json({
      success: true,
      report: {
        ...newReport,
        authorName: authorInfo[0]?.fullName || "همکار",
        authorDepartment: authorInfo[0]?.department,
      },
    });
  } catch (error: any) {
    console.error("Create task report error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
