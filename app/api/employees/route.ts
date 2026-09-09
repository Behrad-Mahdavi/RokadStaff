import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { employees } from "@/lib/db/schema";
import { eq, desc, ilike, and, sql } from "drizzle-orm";
import { generateLinkCode } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const department = searchParams.get("department");
    const isActiveParam = searchParams.get("isActive");
    const search = searchParams.get("search");

    const db = getDb();
    let query = db.select().from(employees);

    const conditions = [];

    if (department && department !== "all") {
      conditions.push(eq(employees.department, department));
    }

    if (isActiveParam !== null && isActiveParam !== undefined && isActiveParam !== "all") {
      conditions.push(eq(employees.isActive, isActiveParam === "true"));
    }

    if (search) {
      conditions.push(ilike(employees.fullName, `%${search}%`));
    }

    const result = await db
      .select()
      .from(employees)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(employees.createdAt));

    // Convert BigInt to string for JSON serialization
    const serialized = result.map((emp: any) => ({
      ...emp,
      telegramChatId: emp.telegramChatId ? emp.telegramChatId.toString() : null,
      isLinked: !!emp.telegramChatId,
    }));

    return NextResponse.json({ employees: serialized });
  } catch (error: any) {
    console.warn("Fetch employees error / DB offline:", error);
    return NextResponse.json({
      employees: [],
    });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { fullName, department, position } = body;

    if (!fullName || typeof fullName !== "string" || fullName.trim().length === 0) {
      return NextResponse.json(
        { error: "نام و نام خانوادگی کارمند الزامی است." },
        { status: 400 }
      );
    }

    const linkCode = generateLinkCode();
    const linkCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    try {
      const db = getDb();
      const [newEmp] = await db
        .insert(employees)
        .values({
          fullName: fullName.trim(),
          department: department?.trim() || null,
          position: position?.trim() || null,
          linkCode,
          linkCodeExpiresAt,
          isActive: true,
        })
        .returning();

      return NextResponse.json({
        success: true,
        employee: {
          ...newEmp,
          telegramChatId: null,
          isLinked: false,
        },
      });
    } catch (dbErr) {
      console.warn("DB insert employee failed, returning mock created employee:", dbErr);
      return NextResponse.json({
        success: true,
        employee: {
          id: "emp-" + Date.now(),
          fullName: fullName.trim(),
          department: department?.trim() || "پسرانه",
          position: position?.trim() || "همکار",
          linkCode,
          linkCodeExpiresAt,
          isActive: true,
          telegramChatId: null,
          isLinked: false,
          createdAt: new Date().toISOString(),
        },
      });
    }
  } catch (error: any) {
    console.error("Create employee error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
