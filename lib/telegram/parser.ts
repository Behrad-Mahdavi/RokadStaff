import { toEnglishDigits } from "../utils";

export interface ParsedTaskItem {
  order: number;
  description: string;
}

export interface ParseResult {
  isValid: boolean;
  items: ParsedTaskItem[];
  reportContent: string;
  error?: string;
}

/**
 * Parses a raw Telegram /report message.
 * Accepts any formatted checklist or free-text report after /report command.
 * Examples supported:
 * /report
 * 1- شرح تسک اول
 * 2- شرح تسک دوم
 *
 * or simply any list of lines.
 */
export function parseReportMessage(text: string): ParseResult {
  if (!text || typeof text !== "string") {
    return {
      isValid: false,
      items: [],
      reportContent: "",
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
      reportContent: "",
      error: "متن پیام خالی است.",
    };
  }

  // First line must start with /report
  const firstLine = lines[0].toLowerCase();
  if (!firstLine.startsWith("/report")) {
    return {
      isValid: false,
      items: [],
      reportContent: "",
      error: "پیام باید با دستور /report شروع شود.",
    };
  }

  // If /report is on the same line as the first task (e.g. /report 1- انجام کارها)
  let reportBodyLines = lines.slice(1);
  const inlineContent = lines[0].replace(/^\/report(@\w+)?\s*/i, "").trim();
  if (inlineContent.length > 0) {
    reportBodyLines = [inlineContent, ...reportBodyLines];
  }

  if (reportBodyLines.length === 0) {
    return {
      isValid: false,
      items: [],
      reportContent: "",
      error: "متن گزارش خالی است! لطفاً شرح کارهای انجام‌شده امروز را بنویسید.",
    };
  }

  const items: ParsedTaskItem[] = [];

  for (let i = 0; i < reportBodyLines.length; i++) {
    const rawLine = reportBodyLines[i];

    // Check if line starts with a number like "1-", "1.", "1)"
    const numMatch = rawLine.match(/^\s*([\d\u06f0-\u06f9\u0660-\u0669]+)[-.)]\s*(.+)$/);
    if (numMatch) {
      const order = parseInt(toEnglishDigits(numMatch[1]), 10) || i + 1;
      const description = numMatch[2].trim();
      items.push({ order, description });
    } else {
      // Plain text line or bullet
      const cleanLine = rawLine.replace(/^[-*•▫️🔹]\s*/, "").trim();
      items.push({ order: i + 1, description: cleanLine });
    }
  }

  return {
    isValid: true,
    items,
    reportContent: reportBodyLines.join("\n"),
  };
}

/**
 * Builds a formatted Persian confirmation message for the employee without task status breakdown.
 */
export function buildReportConfirmationMessage(
  employeeName: string,
  reportDateJalali: string,
  items: ParsedTaskItem[],
  isLate: boolean,
  isEdit: boolean
): string {
  const lines: string[] = [];
  lines.push(`🌿 *رُکاد‌استاف | ثبت گزارش روزانه*`);
  lines.push(``);
  lines.push(`همکار گرامی *${employeeName}*،`);
  lines.push(
    isEdit
      ? `گزارش شما برای تاریخ *${reportDateJalali}* با موفقیت *ویرایش و جایگزین* شد.`
      : `گزارش شما برای تاریخ *${reportDateJalali}* با موفقیت ثبت گردید.`
  );

  if (isLate) {
    lines.push(`⚠️ _وضعیت: ثبت با تأخیر (پس از ساعت کاری)_`);
  } else {
    lines.push(`✨ _وضعیت: ثبت به‌موقع_`);
  }

  lines.push(``);
  lines.push(`📋 *شرح گزارش ثبت‌شده:*`);

  items.forEach((item) => {
    lines.push(`▫️ *${item.order}.* ${item.description}`);
  });

  lines.push(``);
  lines.push(`📊 مجموع موارد: *${items.length} مورد*`);
  lines.push(``);
  lines.push(`💡 _نکته: تا پایان امروز می‌توانید با ارسال مجدد پیام /report گزارش خود را اصلاح نمایید._`);

  return lines.join("\n");
}
