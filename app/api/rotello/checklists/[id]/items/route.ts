import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { checklistItems } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export async function POST(
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
    const title = body.title?.trim();

    if (!title) {
      return NextResponse.json({ error: "عنوان آیتم الزامی است." }, { status: 400 });
    }

    const lastItem: any[] = await db
      .select({ position: checklistItems.position })
      .from(checklistItems)
      .where(eq(checklistItems.checklistId, checklistId))
      .orderBy(desc(checklistItems.position))
      .limit(1);

    const position = lastItem.length > 0 ? lastItem[0].position + 1000 : 1000;

    const [newItem] = await db
      .insert(checklistItems)
      .values({
        checklistId,
        title,
        position,
        isDone: false,
      })
      .returning();

    return NextResponse.json({ success: true, item: newItem });
  } catch (error: any) {
    console.error("Create checklist item error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
