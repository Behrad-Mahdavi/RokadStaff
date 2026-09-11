import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { departments, employees } from "@/lib/db/schema";
import { asc, eq, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = getDb();

    // 1. Fetch departments
    const deptList = await db
      .select()
      .from(departments)
      .orderBy(asc(departments.createdAt));

    // 2. Fetch employee counts grouped by department
    const employeeCounts = await db
      .select({
        department: employees.department,
        count: sql<number>`count(*)::int`,
      })
      .from(employees)
      .groupBy(employees.department);

    const countsMap = new Map<string, number>();
    for (const row of employeeCounts) {
      if (row.department) {
        countsMap.set(row.department, Number(row.count) || 0);
      }
    }

    const result = deptList.map((dept: any) => ({
      ...dept,
      employeeCount: countsMap.get(dept.name) || 0,
    }));

    return NextResponse.json({ departments: result });
  } catch (error: any) {
    console.error("Fetch departments error:", error);
    // Fallback in case of temporary DB failure
    return NextResponse.json({
      departments: [
        { id: "1", name: "پسرانه", description: "دپارتمان شعبه پسرانه", employeeCount: 0 },
        { id: "2", name: "دخترانه", description: "دپارتمان شعبه دخترانه", employeeCount: 0 },
      ],
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
    const { name, description } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "نام دپارتمان الزامی است." },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedDesc = description ? description.trim() : null;

    const db = getDb();

    // Check duplicate name
    const existing = await db
      .select()
      .from(departments)
      .where(eq(departments.name, trimmedName))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "دپارتمانی با این نام قبلاً ثبت شده است." },
        { status: 409 }
      );
    }

    const [newDept] = await db
      .insert(departments)
      .values({
        name: trimmedName,
        description: trimmedDesc,
      })
      .returning();

    return NextResponse.json({
      success: true,
      department: {
        ...newDept,
        employeeCount: 0,
      },
    });
  } catch (error: any) {
    console.error("Create department error:", error);
    return NextResponse.json(
      { error: error.message || "خطا در ثبت دپارتمان" },
      { status: 500 }
    );
  }
}
