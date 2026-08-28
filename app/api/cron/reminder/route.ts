import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { employees, dailyReports } from "@/lib/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { bot, ensureBotInitialized } from "@/lib/telegram/bot";
import { getTehranDateString, formatToJalali } from "@/lib/utils";
import { getSession } from "@/lib/auth/session";

// Delay helper to respect Telegram API rate limits (max ~30 msg/sec)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(req: NextRequest) {
  return handleReminder(req);
}

export async function POST(req: NextRequest) {
  return handleReminder(req);
}

async function handleReminder(req: NextRequest) {
  // Check either Admin Session (from UI click) OR Cron Secret (from Vercel Cron)
  const session = await getSession();
  const authHeader = req.headers.get("authorization");
  const cronHeader = req.headers.get("x-cron-secret");
  const expectedSecret = process.env.CRON_SECRET;

  let isAuthorized = false;
  if (session) {
    isAuthorized = true;
  } else if (expectedSecret) {
    const isBearerValid = authHeader === `Bearer ${expectedSecret}`;
    const isHeaderValid = cronHeader === expectedSecret;
    if (isBearerValid || isHeaderValid) {
      isAuthorized = true;
    }
  } else {
    // If no CRON_SECRET configured and no session
    isAuthorized = false;
  }

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized Cron invocation" }, { status: 401 });
  }

  const db = getDb();
  const todayStr = getTehranDateString();
  const jalaliToday = formatToJalali(new Date());

  try {
    // Ensure bot is initialized for serverless environment
    await ensureBotInitialized();

    // 1. Get all active employees who have a linked telegramChatId
    const activeLinkedEmployees = await db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.isActive, true),
          isNotNull(employees.telegramChatId)
        )
      );

    // 2. Get all submitted reports for today
    const todayReports = await db
      .select({ employeeId: dailyReports.employeeId })
      .from(dailyReports)
      .where(eq(dailyReports.reportDate, todayStr));

    const submittedEmployeeIds = new Set(todayReports.map((r: { employeeId: string }) => r.employeeId));

    // 3. Filter employees who have NOT submitted yet
    const pendingEmployees = activeLinkedEmployees.filter(
      (emp: any) => !submittedEmployeeIds.has(emp.id)
    );

    let sentCount = 0;
    let failedCount = 0;

    for (const emp of pendingEmployees) {
      if (!emp.telegramChatId) continue;

      const reminderMessage = `⏰ *یادآوری ثبت گزارش کار روزانه*

همکار گرامی *${emp.fullName}*،
پایان ساعت کاری امروز (*${jalaliToday}*) نزدیک است و هنوز گزارش کار شما در سامانه ثبت نشده است.

لطفاً چک‌لیست تسک‌های انجام‌شده خود را با دستور زیر ارسال فرمایید:

\`\`\`
/report
1- عنوان تسک اول - انجام شد
2- عنوان تسک دوم - ناقص مانده
\`\`\`

🌿 _با تشکر از همراهی شما_`;

      try {
        await bot.api.sendMessage(Number(emp.telegramChatId), reminderMessage, {
          parse_mode: "Markdown",
        });
        sentCount++;
        // Respect rate limit: 50ms pause between messages
        await delay(50);
      } catch (sendErr) {
        console.error(`Failed to send reminder to ${emp.fullName} (${emp.telegramChatId}):`, sendErr);
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      today: todayStr,
      jalaliToday,
      totalLinkedActive: activeLinkedEmployees.length,
      pendingCount: pendingEmployees.length,
      sentCount,
      failedCount,
    });
  } catch (error: any) {
    console.error("Cron reminder error:", error);
    return NextResponse.json(
      { error: error.message || "Internal Cron Error" },
      { status: 500 }
    );
  }
}
