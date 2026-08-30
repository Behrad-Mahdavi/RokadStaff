import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import {
  projects,
  projectMembers,
  boardColumns,
  tasks,
  employees,
} from "@/lib/db/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// GET /api/rotello/projects - List accessible projects
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("archived") === "true";

    let accessibleProjectIds: string[] = [];

    // Admin sees all projects; Employee sees projects where they are a member
    if (session.role === "admin" || session.role === "supervisor") {
      const allP: any[] = await db.select({ id: projects.id }).from(projects);
      accessibleProjectIds = allP.map((p) => p.id);
    } else if (session.employeeId) {
      const memberships: any[] = await db
        .select({ projectId: projectMembers.projectId })
        .from(projectMembers)
        .where(eq(projectMembers.employeeId, session.employeeId));

      accessibleProjectIds = memberships.map((m) => m.projectId);
    }

    if (accessibleProjectIds.length === 0) {
      return NextResponse.json({ projects: [] });
    }

    // Fetch projects
    let projectList: any[] = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        createdBy: projects.createdBy,
        isArchived: projects.isArchived,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .where(inArray(projects.id, accessibleProjectIds))
      .orderBy(desc(projects.createdAt));

    if (!includeArchived) {
      projectList = projectList.filter((p) => !p.isArchived);
    }

    // Enhance with member count and active task count
    const enhanced = await Promise.all(
      projectList.map(async (proj) => {
        const members: any[] = await db
          .select({
            id: projectMembers.id,
            employeeId: projectMembers.employeeId,
            role: projectMembers.role,
            fullName: employees.fullName,
          })
          .from(projectMembers)
          .innerJoin(employees, eq(projectMembers.employeeId, employees.id))
          .where(eq(projectMembers.projectId, proj.id));

        const activeTasks: any[] = await db
          .select({ id: tasks.id })
          .from(tasks)
          .where(and(eq(tasks.projectId, proj.id), eq(tasks.isDeleted, false)));

        const currentUserMember = members.find(
          (m) => m.employeeId === session.employeeId
        );

        return {
          ...proj,
          membersCount: members.length,
          activeTasksCount: activeTasks.length,
          members,
          userRole:
            session.role === "admin"
              ? "owner"
              : currentUserMember?.role || "viewer",
        };
      })
    );

    return NextResponse.json({ projects: enhanced });
  } catch (error: any) {
    console.error("List projects error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

// POST /api/rotello/projects - Create a new project (Board)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const name = body.name?.trim();
    const description = body.description?.trim() || null;

    if (!name) {
      return NextResponse.json({ error: "نام پروژه الزامی است." }, { status: 400 });
    }

    const db = getDb();

    // Determine creator employee id
    let creatorId = session.employeeId;
    if (!creatorId) {
      // If admin created without employee record, find default admin employee
      const firstEmp: any[] = await db.select().from(employees).limit(1);
      creatorId = firstEmp[0]?.id;
    }

    if (!creatorId) {
      return NextResponse.json(
        { error: "ابتدا حداقل یک کارمند در سیستم ثبت کنید." },
        { status: 400 }
      );
    }

    // 1. Create project
    const [newProject] = await db
      .insert(projects)
      .values({
        name,
        description,
        createdBy: creatorId,
        isArchived: false,
      })
      .returning();

    // 2. Add creator as project manager
    await db.insert(projectMembers).values({
      projectId: newProject.id,
      employeeId: creatorId,
      role: "manager",
    });

    // 3. Create default 4 Kanban columns
    const defaultColumns = [
      { name: "برای انجام", position: 1000, isDoneColumn: false, isEntryColumn: true },
      { name: "در حال انجام", position: 2000, isDoneColumn: false, isEntryColumn: false },
      { name: "بازبینی", position: 3000, isDoneColumn: false, isEntryColumn: false },
      { name: "انجام‌شده", position: 4000, isDoneColumn: true, isEntryColumn: false },
    ];

    for (const col of defaultColumns) {
      await db.insert(boardColumns).values({
        projectId: newProject.id,
        name: col.name,
        position: col.position,
        isDoneColumn: col.isDoneColumn,
        isEntryColumn: col.isEntryColumn,
      });
    }

    return NextResponse.json({
      success: true,
      project: newProject,
    });
  } catch (error: any) {
    console.error("Create project error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
