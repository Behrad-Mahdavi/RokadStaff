import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { boardColumns, projectMembers } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const columnId = params.id;
  const db = getDb();

  try {
    const colResult = await db
      .select()
      .from(boardColumns)
      .where(eq(boardColumns.id, columnId))
      .limit(1);

    if (colResult.length === 0) {
      return NextResponse.json({ error: "ستون یافت نشد." }, { status: 404 });
    }

    const column = colResult[0];

    // Check permission (Manager or Admin)
    if (session.role !== "admin" && session.employeeId) {
      const membership = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, column.projectId),
            eq(projectMembers.employeeId, session.employeeId),
            eq(projectMembers.role, "manager")
          )
        )
        .limit(1);

      if (membership.length === 0) {
        return NextResponse.json({ error: "فقط مدیر پروژه مجاز به ویرایش ستون است." }, { status: 403 });
      }
    }

    const body = await req.json();
    const updateData: any = {};

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.isDoneColumn !== undefined) updateData.isDoneColumn = Boolean(body.isDoneColumn);
    if (body.position !== undefined) updateData.position = Number(body.position);

    const [updated] = await db
      .update(boardColumns)
      .set(updateData)
      .where(eq(boardColumns.id, columnId))
      .returning();

    return NextResponse.json({ success: true, column: updated });
  } catch (error: any) {
    console.error("Update column error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const columnId = params.id;
  const db = getDb();

  try {
    const colResult = await db
      .select()
      .from(boardColumns)
      .where(eq(boardColumns.id, columnId))
      .limit(1);

    if (colResult.length === 0) {
      return NextResponse.json({ error: "ستون یافت نشد." }, { status: 404 });
    }

    const column = colResult[0];

    // Check permission
    if (session.role !== "admin" && session.employeeId) {
      const membership = await db
        .select()
        .from(projectMembers)
        .where(
          and(
            eq(projectMembers.projectId, column.projectId),
            eq(projectMembers.employeeId, session.employeeId),
            eq(projectMembers.role, "manager")
          )
        )
        .limit(1);

      if (membership.length === 0) {
        return NextResponse.json({ error: "فقط مدیر پروژه مجاز به حذف ستون است." }, { status: 403 });
      }
    }

    await db.delete(boardColumns).where(eq(boardColumns.id, columnId));

    return NextResponse.json({ success: true, message: "ستون با موفقیت حذف شد." });
  } catch (error: any) {
    console.error("Delete column error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
