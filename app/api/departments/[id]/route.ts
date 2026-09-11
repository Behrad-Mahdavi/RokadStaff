import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { departments, employees, adminUsers } from "@/lib/db/schema";
import { eq, and, ne, sql } from "drizzle-orm";
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
      .from(departments)
      .where(eq(departments.id, params.id))
      .limit(1);

    if (result.length === 0) {
      return NextResponse.json({ error: "دپارتمان یافت نشد." }, { status: 404 });
    }

    const dept = result[0];
    const [empCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(employees)
      .where(eq(employees.department, dept.name));

    return NextResponse.json({
      department: {
        ...dept,
        employeeCount: empCount?.count || 0,
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

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "دسترسی غیرمجاز: تنها مدیر ارشد مجاز به ویرایش مشخصات دپارتمان است." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { name, description } = body;

    const db = getDb();

    // 1. Fetch current department
    const [currentDept] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, params.id))
      .limit(1);

    if (!currentDept) {
      return NextResponse.json({ error: "دپارتمان یافت نشد." }, { status: 404 });
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    const oldName = currentDept.name;
    const isNameChanging = name !== undefined && name.trim() !== oldName;

    if (isNameChanging) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return NextResponse.json({ error: "نام دپارتمان نمی‌تواند خالی باشد." }, { status: 400 });
      }

      // Check duplicate
      const duplicate = await db
        .select()
        .from(departments)
        .where(and(eq(departments.name, trimmedName), ne(departments.id, params.id)))
        .limit(1);

      if (duplicate.length > 0) {
        return NextResponse.json(
          { error: "دپارتمان دیگری با این نام وجود دارد." },
          { status: 409 }
        );
      }

      updateData.name = trimmedName;
    }

    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }

    // 2. Update department record
    const [updated] = await db
      .update(departments)
      .set(updateData)
      .where(eq(departments.id, params.id))
      .returning();

    // 3. If name changed, propagate to employees and admin_users
    if (isNameChanging) {
      const newName = updateData.name;
      await db
        .update(employees)
        .set({ department: newName })
        .where(eq(employees.department, oldName));

      await db
        .update(adminUsers)
        .set({ assignedDepartment: newName })
        .where(eq(adminUsers.assignedDepartment, oldName));
    }

    // 4. Get updated employee count
    const [empCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(employees)
      .where(eq(employees.department, updated.name));

    return NextResponse.json({
      success: true,
      department: {
        ...updated,
        employeeCount: empCount?.count || 0,
      },
    });
  } catch (error: any) {
    console.error("Update department error:", error);
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

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "دسترسی غیرمجاز: تنها مدیر ارشد مجاز به حذف دپارتمان است." },
      { status: 403 }
    );
  }

  try {
    const db = getDb();

    // 1. Fetch current department
    const [dept] = await db
      .select()
      .from(departments)
      .where(eq(departments.id, params.id))
      .limit(1);

    if (!dept) {
      return NextResponse.json({ error: "دپارتمان یافت نشد." }, { status: 404 });
    }

    // 2. Check if any employees belong to this department
    const [empCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(employees)
      .where(eq(employees.department, dept.name));

    const count = empCount?.count || 0;
    if (count > 0) {
      return NextResponse.json(
        {
          error: `امکان حذف دپارتمان «${dept.name}» وجود ندارد؛ زیرا ${count} همکار در این دپارتمان تعریف شده‌اند. ابتدا دپارتمان این همکاران را ویرایش کنید.`,
        },
        { status: 400 }
      );
    }

    // 3. Delete department
    await db.delete(departments).where(eq(departments.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete department error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
