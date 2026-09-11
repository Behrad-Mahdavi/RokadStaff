import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { employees, adminUsers } from "@/lib/db/schema";
import { eq, desc, ilike, and } from "drizzle-orm";
import { generateLinkCode } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";
import bcrypt from "bcryptjs";

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
    const conditions = [];

    // Scope for supervisor: only see their assigned department
    if (session.role === "supervisor" && session.assignedDepartment) {
      conditions.push(eq(employees.department, session.assignedDepartment));
    } else if (department && department !== "all") {
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
    let { fullName, department, position, role, email, password } = body;

    if (!fullName || typeof fullName !== "string" || fullName.trim().length === 0) {
      return NextResponse.json(
        { error: "نام و نام خانوادگی کارمند الزامی است." },
        { status: 400 }
      );
    }

    // Role enforcement for supervisor: supervisor can ONLY create regular team member (employee)!
    if (session.role === "supervisor") {
      if (role && role !== "employee") {
        return NextResponse.json(
          { error: "راهبر واحد تنها مجاز به تعریف عضو تیم می‌باشد و امکان تعیین سطح دسترسی راهبر یا راهبر ارشد را ندارد." },
          { status: 403 }
        );
      }
      role = "employee";
      department = session.assignedDepartment || department;
    }

    const cleanRole = role === "admin" || role === "supervisor" ? role : "employee";
    const cleanEmail = email ? email.toLowerCase().trim() : null;
    const cleanDept = department?.trim() || null;

    // If role is supervisor or admin, email and password are required
    if (cleanRole === "admin" || cleanRole === "supervisor") {
      if (!cleanEmail || !cleanEmail.includes("@")) {
        return NextResponse.json(
          { error: "جهت اعطای دسترسی به پنل (راهبر ارشد یا راهبر واحد)، وارد کردن ایمیل معتبر الزامی است." },
          { status: 400 }
        );
      }

      if (!password || typeof password !== "string" || password.trim().length < 6) {
        return NextResponse.json(
          { error: "جهت ورود به پنل، کلمه عبور حداقل ۶ کاراکتر الزامی است." },
          { status: 400 }
        );
      }

      if (cleanRole === "supervisor" && !cleanDept) {
        return NextResponse.json(
          { error: "برای نقش راهبر واحد، تعیین دپارتمان الزامی است." },
          { status: 400 }
        );
      }
    }

    const db = getDb();

    // Check duplicate email if provided
    if (cleanEmail) {
      const existingInEmp = await db
        .select()
        .from(employees)
        .where(eq(employees.email, cleanEmail))
        .limit(1);

      if (existingInEmp.length > 0) {
        return NextResponse.json(
          { error: "این ایمیل قبلاً برای همکار دیگری ثبت شده است." },
          { status: 409 }
        );
      }
    }

    const linkCode = generateLinkCode();
    const linkCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // 1. Insert into employees
    const [newEmp] = await db
      .insert(employees)
      .values({
        fullName: fullName.trim(),
        department: cleanDept,
        position: position?.trim() || null,
        role: cleanRole,
        email: cleanEmail,
        linkCode,
        linkCodeExpiresAt,
        isActive: true,
      })
      .returning();

    // 2. If admin or supervisor, sync/create in admin_users table
    if (cleanRole === "admin" || cleanRole === "supervisor") {
      const passwordHash = await bcrypt.hash(password.trim(), 10);
      const existingAdmin = await db
        .select()
        .from(adminUsers)
        .where(eq(adminUsers.email, cleanEmail!))
        .limit(1);

      if (existingAdmin.length > 0) {
        await db
          .update(adminUsers)
          .set({
            fullName: fullName.trim(),
            role: cleanRole,
            assignedDepartment: cleanRole === "supervisor" ? cleanDept : null,
            passwordHash,
            updatedAt: new Date(),
          })
          .where(eq(adminUsers.id, existingAdmin[0].id));
      } else {
        await db.insert(adminUsers).values({
          email: cleanEmail!,
          passwordHash,
          fullName: fullName.trim(),
          role: cleanRole,
          assignedDepartment: cleanRole === "supervisor" ? cleanDept : null,
        });
      }
    }

    return NextResponse.json({
      success: true,
      employee: {
        ...newEmp,
        telegramChatId: null,
        isLinked: false,
      },
    });
  } catch (error: any) {
    console.error("Create employee error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
