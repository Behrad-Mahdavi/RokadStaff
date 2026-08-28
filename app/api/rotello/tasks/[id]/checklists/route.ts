import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { checklists, tasks } from "@/lib/db/schema";
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

  const taskId = params.id;
  const db = getDb();

  try {
    const body = await req.json();
    const title = body.title?.trim() || "چک‌لیست";

    // Determine position
    const lastChecklist: any[] = await db
      .select({ position: checklists.position })
      .from(checklists)
      .where(eq(checklists.taskId, taskId))
      .orderBy(desc(checklists.position))
      .limit(1);

    const position = lastChecklist.length > 0 ? lastChecklist[0].position + 1000 : 1000;

    const [newChecklist] = await db
      .insert(checklists)
      .values({
        taskId,
        title,
        position,
      })
      .returning();

    return NextResponse.json({
      success: true,
      checklist: { ...newChecklist, items: [] },
    });
  } catch (error: any) {
    console.error("Create checklist error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
