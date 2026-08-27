import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { employees } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const result = await db
      .select()
      .from(employees)
      .where(eq(employees.id, params.id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "کارمند یافت نشد." }, { status: 404 });
    }

    const emp = result[0];
    return NextResponse.json({
      employee: {
        ...emp,
        telegramChatId: emp.telegramChatId ? emp.telegramChatId.toString() : null,
        isLinked: !!emp.telegramChatId,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { fullName, department, position, isActive } = body;

    const db = getDb();
    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (department !== undefined) updateData.department = department ? department.trim() : null;
    if (position !== undefined) updateData.position = position ? position.trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const [updated] = await db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "کارمند یافت نشد." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      employee: {
        ...updated,
        telegramChatId: updated.telegramChatId ? updated.telegramChatId.toString() : null,
        isLinked: !!updated.telegramChatId,
      },
    });
  } catch (error: any) {
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

  try {
    const db = getDb();
    await db.delete(employees).where(eq(employees.id, params.id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
