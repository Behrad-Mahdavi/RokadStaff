import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { employees } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { generateLinkCode } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();
    const newCode = generateLinkCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const [updated] = await db
      .update(employees)
      .set({
        linkCode: newCode,
        linkCodeExpiresAt: expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, params.id))
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "کارمند یافت نشد." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      linkCode: newCode,
      linkCodeExpiresAt: expiresAt,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
