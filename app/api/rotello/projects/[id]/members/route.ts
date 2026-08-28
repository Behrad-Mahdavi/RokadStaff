import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { projectMembers, employees } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
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
        return NextResponse.json({ error: "فقط مدیر پروژه مجاز به افزودن عضو است." }, { status: 403 });
      }
    }

    const body = await req.json();
    const { employeeId, role = "member" } = body;

    if (!employeeId) {
      return NextResponse.json({ error: "شناسه کارمند الزامی است." }, { status: 400 });
    }

    // Check if already member
    const existing = await db
      .select()
      .from(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.employeeId, employeeId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update role if already member
      const [updated] = await db
        .update(projectMembers)
        .set({ role })
        .where(eq(projectMembers.id, existing[0].id))
        .returning();
      return NextResponse.json({ success: true, member: updated });
    }

    const [newMember] = await db
      .insert(projectMembers)
      .values({
        projectId,
        employeeId,
        role,
      })
      .returning();

    return NextResponse.json({ success: true, member: newMember });
  } catch (error: any) {
    console.error("Add member error:", error);
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

  const projectId = params.id;
  const db = getDb();

  try {
    const { searchParams } = new URL(req.url);
    const employeeId = searchParams.get("employeeId");

    if (!employeeId) {
      return NextResponse.json({ error: "شناسه کارمند الزامی است." }, { status: 400 });
    }

    // Check permission
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
        return NextResponse.json({ error: "فقط مدیر پروژه مجاز به حذف عضو است." }, { status: 403 });
      }
    }

    await db
      .delete(projectMembers)
      .where(
        and(
          eq(projectMembers.projectId, projectId),
          eq(projectMembers.employeeId, employeeId)
        )
      );

    return NextResponse.json({ success: true, message: "عضو با موفقیت از پروژه حذف شد." });
  } catch (error: any) {
    console.error("Remove member error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
