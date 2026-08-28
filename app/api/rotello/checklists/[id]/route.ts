import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { checklists } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checklistId = params.id;
  const db = getDb();

  try {
    const body = await req.json();
    const updateData: any = {};
    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.position !== undefined) updateData.position = Number(body.position);

    const [updated] = await db
      .update(checklists)
      .set(updateData)
      .where(eq(checklists.id, checklistId))
      .returning();

    return NextResponse.json({ success: true, checklist: updated });
  } catch (error: any) {
    console.error("Update checklist error:", error);
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

  const checklistId = params.id;
  const db = getDb();

  try {
    await db.delete(checklists).where(eq(checklists.id, checklistId));
    return NextResponse.json({ success: true, message: "چک‌لیست با موفقیت حذف شد." });
  } catch (error: any) {
    console.error("Delete checklist error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
