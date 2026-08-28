import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import {
  checklistItems,
  checklists,
  taskActivityLog,
  employees,
} from "@/lib/db/schema";
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

  const itemId = params.id;
  const db = getDb();

  try {
    const itemResult: any[] = await db
      .select({
        id: checklistItems.id,
        checklistId: checklistItems.checklistId,
        title: checklistItems.title,
        isDone: checklistItems.isDone,
        doneBy: checklistItems.doneBy,
        doneAt: checklistItems.doneAt,
        taskId: checklists.taskId,
      })
      .from(checklistItems)
      .innerJoin(checklists, eq(checklistItems.checklistId, checklists.id))
      .where(eq(checklistItems.id, itemId))
      .limit(1);

    if (itemResult.length === 0) {
      return NextResponse.json({ error: "آیتم یافت نشد." }, { status: 404 });
    }

    const currentItem = itemResult[0];
    const body = await req.json();
    const updateData: any = {};

    let actorId = session.employeeId;
    if (!actorId) {
      const firstEmp: any[] = await db.select().from(employees).limit(1);
      actorId = firstEmp[0]?.id;
    }

    if (body.title !== undefined) updateData.title = body.title.trim();
    if (body.position !== undefined) updateData.position = Number(body.position);

    // Toggle isDone logic (Decision 4: Preserve audit on uncheck)
    if (body.isDone !== undefined) {
      const newDone = Boolean(body.isDone);
      updateData.isDone = newDone;

      if (newDone) {
        // Checked: update doneBy and doneAt
        updateData.doneBy = actorId;
        updateData.doneAt = new Date();
      }
      // If unchecked: keep existing doneBy and doneAt for audit history

      // Log activity
      await db.insert(taskActivityLog).values({
        taskId: currentItem.taskId,
        actorId,
        actionType: "checklist_item_checked",
        metadata: {
          itemTitle: currentItem.title,
          isDone: newDone,
        },
      });
    }

    const [updated] = await db
      .update(checklistItems)
      .set(updateData)
      .where(eq(checklistItems.id, itemId))
      .returning();

    // Fetch employee name for response
    let doneByName = null;
    if (updated.doneBy) {
      const emp: any[] = await db
        .select({ fullName: employees.fullName })
        .from(employees)
        .where(eq(employees.id, updated.doneBy))
        .limit(1);
      doneByName = emp[0]?.fullName || null;
    }

    return NextResponse.json({
      success: true,
      item: { ...updated, doneByName },
    });
  } catch (error: any) {
    console.error("Update checklist item error:", error);
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

  const itemId = params.id;
  const db = getDb();

  try {
    await db.delete(checklistItems).where(eq(checklistItems.id, itemId));
    return NextResponse.json({ success: true, message: "آیتم با موفقیت حذف شد." });
  } catch (error: any) {
    console.error("Delete checklist item error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
