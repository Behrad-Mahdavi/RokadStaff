import { Bot } from "grammy";
import { getDb } from "../db/client";
import {
  employees,
  dailyReports,
  reportItems,
  reportHistory,
  botMessageLog,
} from "../db/schema";
import { eq, and, gt } from "drizzle-orm";
import {
  parseReportMessage,
  buildReportConfirmationMessage,
} from "./parser";
import {
  getTehranDateString,
  formatToJalali,
  toEnglishDigits,
} from "../utils";

const botToken = process.env.TELEGRAM_BOT_TOKEN || "";
export const bot = new Bot(botToken || "dummy_token_for_build");

let initPromise: Promise<void> | null = null;

export async function ensureBotInitialized() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token === "dummy_token_for_build") {
    throw new Error("TELEGRAM_BOT_TOKEN environment variable is missing on Vercel!");
  }
  if (!initPromise) {
    initPromise = bot.init().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  await initPromise;
}

// Helper to determine if current time is considered "late" based on WORK_END_HOUR
export function isSubmissionLate(now: Date = new Date()): boolean {
  const endHourConfig = process.env.WORK_END_HOUR || "18:00";
  const [targetH, targetM] = endHourConfig.split(":").map((v) => parseInt(v, 10));

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: process.env.APP_TIMEZONE || "Asia/Tehran",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);

  if (hour > targetH) return true;
  if (hour === targetH && minute > targetM) return true;
  return false;
}

// Log raw update
async function logRawUpdate(chatId: number | undefined, update: any, ok: boolean, errMsg?: string) {
  try {
    const db = getDb();
    await db.insert(botMessageLog).values({
      telegramChatId: chatId ? BigInt(chatId) : null,
      rawUpdate: update,
      processedOk: ok,
      errorMessage: errMsg || null,
    });
  } catch (err) {
    console.error("Error logging bot update:", err);
  }
}

// /start & /help handler
bot.command(["start", "help"], async (ctx) => {
  const text = `🌿 به سامانه گزارش‌دهی رُکاد‌استاف خوش آمدید

این ربات جهت ثبت گزارش کار روزانه همکاران رُکاد طراحی شده است.

📌 مراحل اتصال حساب کاربری:
۱. کد ۶ رقمی اتصال خود را از مدیر سیستم دریافت کنید.
۲. دستور زیر را به همراه کد خود ارسال کنید:
/link 123456

📝 نحوه ارسال گزارش روزانه:
پس از اتصال، هر روز در پایان ساعت کاری گزارش خود را ارسال فرمایید:

/report
1- طراحی صفحه اصلی
2- بازبینی لاجیک وب‌هوک
3- تست نهایی و هماهنگی`;

  await ctx.reply(text);
});

// /link handler
bot.command("link", async (ctx) => {
  const chatId = ctx.chat?.id;
  if (!chatId) return;

  const rawText = ctx.message?.text || "";
  const matchArgs = ctx.match?.trim() || "";
  const fallbackArgs = rawText.replace(/^\/link(@\w+)?\s*/i, "").trim();
  const codeArg = matchArgs || fallbackArgs;
  const code = toEnglishDigits(codeArg);

  if (!code || code.length !== 6) {
    await ctx.reply(
      "⚠️ لطفاً کد ۶ رقمی اتصال را همراه با دستور بفرستید:\nمثال: /link 123456"
    );
    return;
  }

  const db = getDb();

  try {
    // 1. Check if this telegram_chat_id is already linked to another employee
    const existingChat = await db
      .select()
      .from(employees)
      .where(eq(employees.telegramChatId, BigInt(chatId)))
      .limit(1);

    if (existingChat.length > 0) {
      const emp = existingChat[0];
      await ctx.reply(
        `⚠️ این اکانت تلگرام قبلاً به حساب کاربری «${emp.fullName}» متصل شده است.\nدر صورت نیاز به تغییر، با مدیر سیستم تماس بگیرید.`
      );
      return;
    }

    // 2. Find employee with matching unexpired link_code
    const now = new Date();
    const matched = await db
      .select()
      .from(employees)
      .where(
        and(
          eq(employees.linkCode, code),
          gt(employees.linkCodeExpiresAt, now)
        )
      )
      .limit(1);

    if (matched.length === 0) {
      await ctx.reply(
        "❌ کد وارد شده نامعتبر است یا منقضی شده است.\nلطفاً از مدیر سیستم درخواست کد جدید نمایید."
      );
      return;
    }

    const employee = matched[0];

    // 3. Link account: set telegramChatId and clear linkCode
    await db
      .update(employees)
      .set({
        telegramChatId: BigInt(chatId),
        linkCode: null,
        linkCodeExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, employee.id));

    await ctx.reply(
      `🎉 اتصال حساب با موفقیت انجام شد!\n\nهمکار گرامی «${employee.fullName}» (${employee.department || "عمومی"} - ${employee.position || "همکار"})\nحساب تلگرام شما به سامانه رُکاد متصل گردید.\n\nاز امروز می‌توانید گزارش‌های روزانه خود را با دستور /report ارسال فرمایید.`
    );
    await logRawUpdate(chatId, ctx.update, true);
  } catch (err: any) {
    console.error("Link error:", err);
    await logRawUpdate(chatId, ctx.update, false, err.message);
    await ctx.reply("❌ در اتصال حساب کاربری خطایی رخ داد. لطفاً دقایقی بعد تلاش کنید.");
  }
});

// /report or regular text message handler
bot.on("message:text", async (ctx) => {
  const text = ctx.message.text.trim();
  const chatId = ctx.chat.id;

  // Ignore /start, /help, /link because they have specific handlers
  if (text.startsWith("/start") || text.startsWith("/help") || text.startsWith("/link")) {
    return;
  }

  const db = getDb();

  // Check if sender is a linked employee
  const employeeResult = await db
    .select()
    .from(employees)
    .where(eq(employees.telegramChatId, BigInt(chatId)))
    .limit(1);

  if (employeeResult.length === 0) {
    await ctx.reply(
      "⚠️ حساب تلگرام شما هنوز به هیچ کارمندی در رُکاد متصل نشده است!\n\nجهت اتصال، کد ۶ رقمی دریافتی از مدیر را بفرستید:\n/link 123456"
    );
    return;
  }

  const employee = employeeResult[0];

  if (!employee.isActive) {
    await ctx.reply("⛔️ حساب کاربری شما غیرفعال شده است. لطفاً با مدیر سیستم تماس بگیرید.");
    return;
  }

  // Check if message is a report
  if (!text.toLowerCase().startsWith("/report")) {
    await ctx.reply(
      `💡 برای ثبت گزارش روزانه، لطفاً پیام خود را با /report شروع کنید:\n\n/report\n1- عنوان کار اول\n2- عنوان کار دوم`
    );
    return;
  }

  // Parse report
  const parseResult = parseReportMessage(text);
  if (!parseResult.isValid) {
    await ctx.reply(`❌ ${parseResult.error}`);
    await logRawUpdate(chatId, ctx.update, false, parseResult.error);
    return;
  }

  const reportDateStr = getTehranDateString();
  const isLate = isSubmissionLate();
  const status = isLate ? "late" : "on_time";

  try {
    // Check if report already exists for today
    const existingReports = await db
      .select()
      .from(dailyReports)
      .where(
        and(
          eq(dailyReports.employeeId, employee.id),
          eq(dailyReports.reportDate, reportDateStr)
        )
      )
      .limit(1);

    let reportId: string;
    let isEdit = false;

    if (existingReports.length > 0) {
      // OVERWRITE / REPLACE EXISTING REPORT
      isEdit = true;
      const prev = existingReports[0];
      reportId = prev.id;

      // 1. Push previous text to report_history (Audit Trail)
      await db.insert(reportHistory).values({
        originalReportId: prev.id,
        employeeId: employee.id,
        rawText: prev.rawText,
        replacedAt: new Date(),
      });

      // 2. Update daily_report
      await db
        .update(dailyReports)
        .set({
          rawText: text,
          status,
          submittedAt: new Date(),
          editedCount: (prev.editedCount || 0) + 1,
        })
        .where(eq(dailyReports.id, prev.id));

      // 3. Remove old items
      await db.delete(reportItems).where(eq(reportItems.reportId, prev.id));
    } else {
      // NEW REPORT FOR TODAY
      const [inserted] = await db
        .insert(dailyReports)
        .values({
          employeeId: employee.id,
          reportDate: reportDateStr,
          rawText: text,
          status,
          submittedAt: new Date(),
          editedCount: 0,
        })
        .returning({ id: dailyReports.id });

      reportId = inserted.id;
    }

    // Insert new task items
    const itemsToInsert = parseResult.items.map((item) => ({
      reportId,
      taskOrder: item.order,
      description: item.description,
      status: "submitted",
    }));

    await db.insert(reportItems).values(itemsToInsert);

    // Send confirmation message
    const jalaliDate = formatToJalali(new Date());
    const confirmation = buildReportConfirmationMessage(
      employee.fullName,
      jalaliDate,
      parseResult.items,
      isLate,
      isEdit
    );

    await ctx.reply(confirmation);
    await logRawUpdate(chatId, ctx.update, true);
  } catch (err: any) {
    console.error("Report processing error:", err);
    await logRawUpdate(chatId, ctx.update, false, err.message);
    await ctx.reply("❌ متأسفانه در ثبت گزارش خطایی رخ داد. لطفاً مجدداً تلاش کنید.");
  }
});
