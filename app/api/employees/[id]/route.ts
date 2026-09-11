import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { employees, adminUsers } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import bcrypt from "bcryptjs";

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

    // Supervisor check
    if (session.role === "supervisor" && session.assignedDepartment && emp.department !== session.assignedDepartment) {
      return NextResponse.json({ error: "دسترسی غیرمجاز به اطلاعات این همکار." }, { status: 403 });
    }

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
    let { fullName, department, position, isActive, role, email, password } = body;

    const db = getDb();
    const target = await db
      .select()
      .from(employees)
      .where(eq(employees.id, params.id))
      .limit(1);

    if (target.length === 0) {
      return NextResponse.json({ error: "همکار یافت نشد." }, { status: 404 });
    }

    const existingEmp = target[0];

    // Supervisor restrictions
    if (session.role === "supervisor") {
      if (session.assignedDepartment && existingEmp.department !== session.assignedDepartment) {
        return NextResponse.json(
          { error: "دسترسی غیرمجاز: شما تنها مجاز به ویرایش همکاران دپارتمان خود هستید." },
          { status: 403 }
        );
      }
      if (existingEmp.role === "admin") {
        return NextResponse.json(
          { error: "سرپرست واحد مجاز به ویرایش حساب مدیر ارشد نمی‌باشد." },
          { status: 403 }
        );
      }
      if (role === "admin") {
        return NextResponse.json(
          { error: "سرپرست واحد مجاز به اعطای نقش مدیر ارشد نمی‌باشد." },
          { status: 403 }
        );
      }
      department = session.assignedDepartment || existingEmp.department;
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (department !== undefined) updateData.department = department ? department.trim() : null;
    if (position !== undefined) updateData.position = position ? position.trim() : null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const targetRole = role !== undefined ? (role === "admin" || role === "supervisor" ? role : "employee") : existingEmp.role;
    updateData.role = targetRole;

    const cleanEmail = email !== undefined ? (email ? email.toLowerCase().trim() : null) : existingEmp.email;
    if (cleanEmail !== existingEmp.email) {
      if (cleanEmail) {
        // Check duplicate email
        const dup = await db
          .select()
          .from(employees)
          .where(and(eq(employees.email, cleanEmail), ne(employees.id, params.id)))
          .limit(1);
        if (dup.length > 0) {
          return NextResponse.json({ error: "این ایمیل قبلاً برای همکار دیگری ثبت شده است." }, { status: 409 });
        }
      }
      updateData.email = cleanEmail;
    }

    // Role requirements
    if ((targetRole === "admin" || targetRole === "supervisor") && !cleanEmail) {
      return NextResponse.json(
        { error: "برای نقش‌های دارای دسترسی به پنل (سرپرست یا مدیر ارشد)، ایمیل الزامی است." },
        { status: 400 }
      );
    }

    // Update employees table
    const [updated] = await db
      .update(employees)
      .set(updateData)
      .where(eq(employees.id, params.id))
      .returning();

    // Synchronize with admin_users table
    const effectiveEmail = cleanEmail || existingEmp.email;
    if (targetRole === "admin" || targetRole === "supervisor") {
      if (effectiveEmail) {
        const existingAdmin = await db
          .select()
          .from(adminUsers)
          .where(eq(adminUsers.email, effectiveEmail))
          .limit(1);

        const adminPayload: Record<string, any> = {
          fullName: updated.fullName,
          role: targetRole,
          assignedDepartment: targetRole === "supervisor" ? updated.department : null,
          email: effectiveEmail,
          updatedAt: new Date(),
        };

        if (password && typeof password === "string" && password.trim().length >= 6) {
          adminPayload.passwordHash = await bcrypt.hash(password.trim(), 10);
        }

        if (existingAdmin.length > 0) {
          await db
            .update(adminUsers)
            .set(adminPayload)
            .where(eq(adminUsers.id, existingAdmin[0].id));
        } else {
          // New admin user required - must have password
          if (!password || password.trim().length < 6) {
            // If no password provided, use default temporary password
            adminPayload.passwordHash = await bcrypt.hash("123456", 10);
          }
          await db.insert(adminUsers).values(adminPayload as any);
        }
      }
    } else if (targetRole === "employee" && existingEmp.role !== "employee") {
      // Downgraded to regular employee: remove login access from admin_users
      if (effectiveEmail) {
        await db.delete(adminUsers).where(eq(adminUsers.email, effectiveEmail));
      }
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
    console.error("Update employee error:", error);
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
    const target = await db
      .select()
      .from(employees)
      .where(eq(employees.id, params.id))
      .limit(1);

    if (target.length === 0) {
      return NextResponse.json({ error: "همکار یافت نشد." }, { status: 404 });
    }

    const emp = target[0];

    // Supervisor restrictions
    if (session.role === "supervisor") {
      if (session.assignedDepartment && emp.department !== session.assignedDepartment) {
        return NextResponse.json(
          { error: "دسترسی غیرمجاز: شما تنها مجاز به حذف همکاران دپارتمان خود هستید." },
          { status: 403 }
        );
      }
      if (emp.role === "admin") {
        return NextResponse.json(
          { error: "سرپرست واحد مجاز به حذف مدیر ارشد نمی‌باشد." },
          { status: 403 }
        );
      }
    }

    // If had admin user, remove it
    if (emp.email) {
      await db.delete(adminUsers).where(eq(adminUsers.email, emp.email));
    }

    await db.delete(employees).where(eq(employees.id, params.id));
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
