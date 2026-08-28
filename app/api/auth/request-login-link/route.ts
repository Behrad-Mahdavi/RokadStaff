import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { employees, loginTokens } from "@/lib/db/schema";
import { eq, or, and, ilike, desc } from "drizzle-orm";
import { notifyService } from "@/lib/telegram/notify";
import crypto from "crypto";

// Normalize Persian characters and trim
function normalizePersianText(str: string): string {
  return str
    .trim()
    .replace(/ي/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\u200b]/g, " ") // Replace ZWNJ with space for search
    .replace(/\s+/g, " ");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawIdentifier = body.identifier?.trim();

    if (!rawIdentifier) {
      return NextResponse.json(
        { error: "لطفاً نام یا شماره پرسنلی خود را وارد کنید." },
        { status: 400 }
      );
    }

    const cleanInput = normalizePersianText(rawIdentifier);
    const db = getDb();

    // 1. Fetch all active employees
    const allActive: any[] = await db
      .select()
      .from(employees)
      .where(eq(employees.isActive, true))
      .orderBy(desc(employees.updatedAt));

    // 2. Find matching employees
    const matched = allActive.filter((emp) => {
      const normName = normalizePersianText(emp.fullName || "");
      const matchName =
        normName.includes(cleanInput) ||
        cleanInput.includes(normName) ||
        normName.replace(/\s/g, "").includes(cleanInput.replace(/\s/g, ""));
      const matchCode = emp.linkCode && emp.linkCode === rawIdentifier;
      return matchName || matchCode;
    });

    if (matched.length === 0) {
      return NextResponse.json(
        { error: "همکاری با این نام یافت نشد یا حساب کاربری غیرفعال است." },
        { status: 404 }
      );
    }

    // Prioritize the employee account that is actually linked to Telegram
    const employee =
      matched.find((e) => Boolean(e.telegramChatId)) || matched[0];

    if (!employee.telegramChatId) {
      return NextResponse.json(
        {
          error: `حساب کاربری «${employee.fullName}» هنوز به ربات تلگرام متصل نشده است. لطفاً ابتدا در ربات تلگرام پیام دهید یا کد اتصال خود (${employee.linkCode || "تعریف‌نشده"}) را به ربات ارسال کنید.`,
        },
        { status: 400 }
      );
    }

    // 3. Generate secure random token
    const token = crypto.randomBytes(24).toString("hex");
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.insert(loginTokens).values({
      employeeId: employee.id,
      token,
      expiresAt,
    });

    // Detect base URL
    const origin =
      process.env.APP_URL ||
      req.headers.get("origin") ||
      (req.headers.get("host")
        ? `https://${req.headers.get("host")}`
        : "https://rotello-staff.vercel.app");
    const loginUrl = `${origin}/auth/verify?token=${token}`;

    // 4. Send Magic Link via Telegram bot
    const sentOk = await notifyService.sendMagicLink(
      Number(employee.telegramChatId),
      employee.fullName,
      loginUrl
    );

    if (!sentOk) {
      return NextResponse.json(
        {
          error:
            "ارسال پیام به تلگرام شما با خطا مواجه شد. لطفاً مطمئن شوید ربات را در تلگرام استارت کرده‌اید و بلاک نیست.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `لینک ورود مستقیم با موفقیت به ربات تلگرام «${employee.fullName}» ارسال شد. لطفاً تلگرام خود را چک کنید.`,
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
