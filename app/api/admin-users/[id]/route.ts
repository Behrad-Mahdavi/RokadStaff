import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { adminUsers } from "@/lib/db/schema";
import { eq, and, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth/session";

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
      { error: "دسترسی غیرمجاز: تنها راهبر ارشد می‌تواند سطح دسترسی کاربران را ویرایش کند." },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const { fullName, email, role, assignedDepartment, newPassword } = body;

    const db = getDb();
    const [targetUser] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, params.id))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (fullName !== undefined) {
      const trimmed = fullName.trim();
      if (!trimmed) {
        return NextResponse.json({ error: "نام نمی‌تواند خالی باشد." }, { status: 400 });
      }
      updateData.fullName = trimmed;
    }

    if (email !== undefined) {
      const cleanEmail = email.toLowerCase().trim();
      if (!cleanEmail || !cleanEmail.includes("@")) {
        return NextResponse.json({ error: "ایمیل معتبر نیست." }, { status: 400 });
      }

      if (cleanEmail !== targetUser.email) {
        const duplicate = await db
          .select()
          .from(adminUsers)
          .where(and(eq(adminUsers.email, cleanEmail), ne(adminUsers.id, params.id)))
          .limit(1);

        if (duplicate.length > 0) {
          return NextResponse.json(
            { error: "کاربر دیگری با این ایمیل در سامانه ثبت شده است." },
            { status: 409 }
          );
        }
        updateData.email = cleanEmail;
      }
    }

    if (role !== undefined) {
      if (role !== "admin" && role !== "supervisor") {
        return NextResponse.json({ error: "نقش نامعتبر است." }, { status: 400 });
      }

      // Prevent demoting self from admin to supervisor
      if (targetUser.id === session.userId && role !== "admin") {
        return NextResponse.json(
          { error: "امکان تنزل سطح دسترسی حساب کاربری فعال خودتان وجود ندارد." },
          { status: 400 }
        );
      }

      updateData.role = role;
      if (role === "supervisor") {
        if (!assignedDepartment && !targetUser.assignedDepartment) {
          return NextResponse.json(
            { error: "برای نقش راهبر واحد، انتخاب دپارتمان الزامی است." },
            { status: 400 }
          );
        }
        updateData.assignedDepartment = assignedDepartment ? assignedDepartment.trim() : targetUser.assignedDepartment;
      } else {
        updateData.assignedDepartment = null;
      }
    } else if (assignedDepartment !== undefined && targetUser.role === "supervisor") {
      updateData.assignedDepartment = assignedDepartment ? assignedDepartment.trim() : null;
    }

    if (newPassword) {
      if (typeof newPassword !== "string" || newPassword.trim().length < 6) {
        return NextResponse.json(
          { error: "کلمه عبور جدید باید حداقل ۶ کاراکتر باشد." },
          { status: 400 }
        );
      }
      updateData.passwordHash = await bcrypt.hash(newPassword.trim(), 10);
    }

    const [updated] = await db
      .update(adminUsers)
      .set(updateData)
      .where(eq(adminUsers.id, params.id))
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
      user: updated,
    });
  } catch (error: any) {
    console.error("Update admin user error:", error);
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
      { error: "دسترسی غیرمجاز: تنها راهبر ارشد می‌تواند کاربران را حذف کند." },
      { status: 403 }
    );
  }

  try {
    const db = getDb();
    const [targetUser] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, params.id))
      .limit(1);

    if (!targetUser) {
      return NextResponse.json({ error: "کاربر یافت نشد." }, { status: 404 });
    }

    // Safety check: Cannot delete your own active account
    if (targetUser.id === session.userId || targetUser.email === session.email) {
      return NextResponse.json(
        { error: "امکان حذف حساب کاربری راهبر ارشد در حال استفاده وجود ندارد." },
        { status: 400 }
      );
    }

    await db.delete(adminUsers).where(eq(adminUsers.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete admin user error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
