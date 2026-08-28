import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { boardColumns, projectMembers } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export async function POST(
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
        return NextResponse.json({ error: "فقط مدیر پروژه مجاز به افزودن ستون است." }, { status: 403 });
      }
    }

    const body = await req.json();
    const name = body.name?.trim();
    const isDoneColumn = Boolean(body.isDoneColumn);

    if (!name) {
      return NextResponse.json({ error: "نام ستون الزامی است." }, { status: 400 });
    }

    // Determine position (last + 1000)
    const lastCol: any[] = await db
      .select({ position: boardColumns.position })
      .from(boardColumns)
      .where(eq(boardColumns.projectId, projectId))
      .orderBy(desc(boardColumns.position))
      .limit(1);

    const position = lastCol.length > 0 ? lastCol[0].position + 1000 : 1000;

    const [newCol] = await db
      .insert(boardColumns)
      .values({
        projectId,
        name,
        position,
        isDoneColumn,
      })
      .returning();

    return NextResponse.json({ success: true, column: newCol });
  } catch (error: any) {
    console.error("Create column error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
