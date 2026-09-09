import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { boardColumns, projectMembers } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

// GET /api/rotello/projects/[id]/columns
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = params.id;
  try {
    const db = getDb();
    const cols = await db
      .select()
      .from(boardColumns)
      .where(eq(boardColumns.projectId, projectId))
      .orderBy(boardColumns.position);

    if (cols.length > 0) {
      return NextResponse.json({ columns: cols });
    }
    const { getMockColumns } = await import("@/lib/mockRotello");
    return NextResponse.json({ columns: getMockColumns(projectId) });
  } catch (err) {
    const { getMockColumns } = await import("@/lib/mockRotello");
    return NextResponse.json({ columns: getMockColumns(projectId) });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const projectId = params.id;
  let name = "";
  let isDoneColumn = false;

  try {
    const body = await req.json();
    name = body.name?.trim();
    isDoneColumn = Boolean(body.isDoneColumn);

    if (!name) {
      return NextResponse.json({ error: "نام ستون الزامی است." }, { status: 400 });
    }

    try {
      const db = getDb();
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
    } catch (dbErr) {
      const { createMockColumn } = await import("@/lib/mockRotello");
      const col = createMockColumn({
        projectId,
        name,
        isDoneColumn,
      });
      return NextResponse.json({ success: true, column: col });
    }
  } catch (error: any) {
    console.error("Create column error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
