import { toEnglishDigits } from "../utils";

export type TaskStatus = "done" | "incomplete" | "cancelled";

export interface ParsedTaskItem {
  order: number;
  description: string;
  status: TaskStatus;
  statusFa: string;
}

export interface ParseResult {
  isValid: boolean;
  items: ParsedTaskItem[];
  error?: string;
  errorLine?: number;
}

const STATUS_MAP: Record<string, TaskStatus> = {
  "انجام شد": "done",
  "ناقص مانده": "incomplete",
  "لغو شد": "cancelled",
};

/**
 * Parses a raw Telegram /report message.
 * Format expected:
 * /report
 * 1- شرح تسک اول - انجام شد
 * 2- شرح تسک دوم - ناقص مانده
 * 3- شرح تسک سوم - لغو شد
 */
export function parseReportMessage(text: string): ParseResult {
  if (!text || typeof text !== "string") {
    return {
      isValid: false,
      items: [],
      error: "متن پیام خالی است.",
    };
  }

  // Normalize line endings and trim
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length === 0) {
    return {
      isValid: false,
      items: [],
      error: "متن پیام خالی است.",
    };
  }

  // First line must start with /report
  const firstLine = lines[0].toLowerCase();
  if (!firstLine.startsWith("/report")) {
    return {
      isValid: false,
      items: [],
      error: "پیام باید با دستور /report شروع شود.",
    };
  }

  const taskLines = lines.slice(1);
  if (taskLines.length === 0) {
    return {
      isValid: false,
      items: [],
      error: "گزارش شما شامل هیچ تسکی نیست! لطفاً حداقل یک مورد ثبت کنید.",
    };
  }

  // Regex pattern for each line:
  // ^\s*(\d+)[-.]\s*(.+?)\s*-\s*(انجام شد|ناقص مانده|لغو شد)\s*$
  // We allow English and Persian digits
  const regex = /^\s*([\d\u06f0-\u06f9\u0660-\u0669]+)[-.]\s*(.+?)\s*[-–—]\s*(انجام شد|ناقص مانده|لغو شد)\s*$/;

  const items: ParsedTaskItem[] = [];

  for (let i = 0; i < taskLines.length; i++) {
    const rawLine = taskLines[i];
    const lineNumber = i + 2; // 1-indexed including /report line

    const match = rawLine.match(regex);
    if (!match) {
      return {
        isValid: false,
        items: [],
        errorLine: lineNumber,
        error: `خطای ساختاری در خط ${lineNumber}:\n«${rawLine}»\n\nالگوی مجاز:\nشماره - عنوان تسک - وضعیت (انجام شد / ناقص مانده / لغو شد)`,
      };
    }

    const orderStr = toEnglishDigits(match[1]);
    const order = parseInt(orderStr, 10);
    const description = match[2].trim();
    const statusFa = match[3].trim();
    const status = STATUS_MAP[statusFa];

    if (isNaN(order) || !description || !status) {
      return {
        isValid: false,
        items: [],
        errorLine: lineNumber,
        error: `خطا در پارس مقادیر خط ${lineNumber}`,
      };
    }

    items.push({
      order,
      description,
      status,
      statusFa,
    });
  }

  return {
    isValid: true,
    items,
  };
}

/**
 * Builds a formatted Persian confirmation message for the employee
 */
export function buildReportConfirmationMessage(
  employeeName: string,
  reportDateJalali: string,
  items: ParsedTaskItem[],
  isLate: boolean,
  isEdit: boolean
): string {
  const statusEmojiMap: Record<TaskStatus, string> = {
    done: "✅",
    incomplete: "⏳",
    cancelled: "❌",
  };

  const lines: string[] = [];
  lines.push(`🌿 *رُکاد‌استاف | ثبت گزارش روزانه*`);
  lines.push(``);
  lines.push(`همکار گرامی *${employeeName}*،`);
  lines.push(
    isEdit
      ? `گزارش شما برای تاریخ *${reportDateJalali}* با موفقیت *ویرایش و جایگزین* شد.`
      : `گزارش شما برای تاریخ *${reportDateJalali}* با موفقیت ثبت شد.`
  );
  
  if (isLate) {
    lines.push(`⚠️ _وضعیت: ثبت با تأخیر (پس از ساعت کاری)_`);
  } else {
    lines.push(`✨ _وضعیت: به‌موقع_`);
  }

  lines.push(``);
  lines.push(`📋 *خلاصه چک‌لیست ثبت‌شده:*`);
  
  items.forEach((item) => {
    const emoji = statusEmojiMap[item.status] || "▫️";
    lines.push(`${emoji} *${item.order}.* ${item.description} _(${item.statusFa})_`);
  });

  const doneCount = items.filter((i) => i.status === "done").length;
  const incompleteCount = items.filter((i) => i.status === "incomplete").length;
  const cancelledCount = items.filter((i) => i.status === "cancelled").length;

  lines.push(``);
  lines.push(`📊 مجموع: *${items.length} تسک* | ${doneCount} انجام شده | ${incompleteCount} ناقص | ${cancelledCount} لغو شده`);
  lines.push(``);
  lines.push(`💡 _نکته: تا پایان امروز می‌توانید با ارسال مجدد فرمت /report گزارش خود را اصلاح کنید._`);

  return lines.join("\n");
}
