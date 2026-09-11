import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { adminUsers } from "@/lib/db/schema";
import { asc, eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth/session";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "دسترسی غیرمجاز: تنها راهبر ارشد می‌تواند لیست کاربران سیستم را مشاهده کند." },
      { status: 403 }
    );
  }

  try {
    const db = getDb();
    const users = await db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        fullName: adminUsers.fullName,
        role: adminUsers.role,
        assignedDepartment: adminUsers.assignedDepartment,
        createdAt: adminUsers.createdAt,
        updatedAt: adminUsers.updatedAt,
      })
      .from(adminUsers)
      .orderBy(asc(adminUsers.createdAt));

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error("Fetch admin users error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.role !== "admin") {
    return NextResponse.json(
      { error: "دسترسی غیرمجاز: تنها راهبر ارشد می‌تواند کاربر جدید با سطح دسترسی تعریف کند." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { email, password, fullName, role, assignedDepartment } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json({ error: "ایمیل معتبر الزامی است." }, { status: 400 });
    }

    if (!password || typeof password !== "string" || password.trim().length < 6) {
      return NextResponse.json({ error: "کلمه عبور باید حداقل ۶ کاراکتر باشد." }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanRole = role === "admin" ? "admin" : "supervisor";
    const cleanName = fullName?.trim() || (cleanRole === "admin" ? "راهبر ارشد سیستم" : "راهبر دپارتمان");
    const cleanDept = cleanRole === "supervisor" ? assignedDepartment?.trim() || null : null;

    if (cleanRole === "supervisor" && !cleanDept) {
      return NextResponse.json(
        { error: "برای نقش راهبر واحد، انتخاب دپارتمان الزامی است." },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check duplicate email
    const existing = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, cleanEmail))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "کاربری با این ایمیل قبلاً در سامانه ثبت شده است." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password.trim(), 10);

    const [newUser] = await db
      .insert(adminUsers)
      .values({
        email: cleanEmail,
        passwordHash,
        fullName: cleanName,
        role: cleanRole,
        assignedDepartment: cleanDept,
      })
      .returning({
        id: adminUsers.id,
        email: adminUsers.email,
        fullName: adminUsers.fullName,
        role: adminUsers.role,
        assignedDepartment: adminUsers.assignedDepartment,
        createdAt: adminUsers.createdAt,
        updatedAt: adminUsers.updatedAt,
      });

    return NextResponse.json({
      success: true,
      user: newUser,
    });
  } catch (error: any) {
    console.error("Create admin user error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
