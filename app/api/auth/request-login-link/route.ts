import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { employees, loginTokens } from "@/lib/db/schema";
import { eq, or, and, ilike } from "drizzle-orm";
import { notifyService } from "@/lib/telegram/notify";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = body.identifier?.trim();

    if (!identifier) {
      return NextResponse.json(
        { error: "لطفاً نام یا شماره پرسنلی خود را وارد کنید." },
        { status: 400 }
      );
    }

    const db = getDb();

    // Find active employee by name or linkCode
    const matchedEmployees: any[] = await db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.isActive, true),
          or(
            ilike(employees.fullName, `%${identifier}%`),
            eq(employees.linkCode, identifier)
          )
        )
      )
      .limit(1);

    if (matchedEmployees.length === 0) {
      return NextResponse.json(
        { error: "همکاری با این مشخصات یافت نشد یا حساب کاربری غیرفعال است." },
        { status: 404 }
      );
    }

    const employee = matchedEmployees[0];

    if (!employee.telegramChatId) {
      return NextResponse.json(
        {
          error:
            "حساب کاربری شما هنوز به ربات تلگرام متصل نشده است. ابتدا دستور /link را در ربات بفرستید یا با مدیر تماس بگیرید.",
        },
        { status: 400 }
      );
    }

    // Generate secure random token
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(loginTokens).values({
      employeeId: employee.id,
      token,
      expiresAt,
    });

    // Detect base URL
    const origin =
      req.headers.get("origin") ||
      (req.headers.get("host") ? `https://${req.headers.get("host")}` : "https://rokad-staff.vercel.app");
    const loginUrl = `${origin}/auth/verify?token=${token}`;

    // Send Magic Link via Telegram bot
    const sentOk = await notifyService.sendMagicLink(
      Number(employee.telegramChatId),
      employee.fullName,
      loginUrl
    );

    if (!sentOk) {
      return NextResponse.json(
        { error: "ارسال پیام به تلگرام شما با خطا مواجه شد. لطفاً مطمئن شوید ربات را بلاک نکرده‌اید." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `لینک ورود مستقیم با موفقیت به ربات تلگرام «${employee.fullName}» ارسال شد.`,
      employeeName: employee.fullName,
    });
  } catch (error: any) {
    console.error("Magic link request error:", error);
    return NextResponse.json(
      { error: error.message || "خطای سرور" },
      { status: 500 }
    );
  }
}
