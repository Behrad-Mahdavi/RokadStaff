import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import jalaali from "jalaali-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Persian month names
export const PERSIAN_MONTH_NAMES = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

// Persian day names
export const PERSIAN_WEEKDAY_NAMES = [
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنج‌شنبه",
  "جمعه",
  "شنبه",
];

// Convert English numbers to Persian digits
export function toPersianDigits(n: number | string | null | undefined): string {
  if (n === null || n === undefined) return "";
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return n.toString().replace(/\d/g, (x) => persianDigits[parseInt(x, 10)]);
}

// Convert Persian numbers to English digits
export function toEnglishDigits(str: string): string {
  if (!str) return "";
  const persianDigits = /[\u06f0-\u06f9\u0660-\u0669]/g;
  return str.replace(persianDigits, (c) => {
    return (c.charCodeAt(0) & 0xf).toString();
  });
}

// Format Date object or YYYY-MM-DD string to Jalali (e.g. "۱۴۰۳/۰۶/۰۵" or "۵ شهریور ۱۴۰۳")
export function formatToJalali(
  date: Date | string | null,
  options?: { showMonthName?: boolean; includeDayName?: boolean }
): string {
  if (!date) return "-";
  let d: Date;
  if (typeof date === "string") {
    // If format is YYYY-MM-DD
    const parts = date.split("-");
    if (parts.length === 3) {
      d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    } else {
      d = new Date(date);
    }
  } else {
    d = date;
  }

  if (isNaN(d.getTime())) return "-";

  const j = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());

  if (options?.showMonthName) {
    const monthName = PERSIAN_MONTH_NAMES[j.jm - 1];
    const dayName = options.includeDayName ? `${PERSIAN_WEEKDAY_NAMES[d.getDay()]} ` : "";
    return toPersianDigits(`${dayName}${j.jd} ${monthName} ${j.jy}`);
  }

  const mm = String(j.jm).padStart(2, "0");
  const dd = String(j.jd).padStart(2, "0");
  return toPersianDigits(`${j.jy}/${mm}/${dd}`);
}

// Format time in Tehran timezone (HH:mm)
export function formatTehranTime(date: Date | string | null): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "-";
  try {
    const formatted = new Intl.DateTimeFormat("fa-IR", {
      timeZone: "Asia/Tehran",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d);
    return formatted;
  } catch {
    return "-";
  }
}

// Get current date string in Tehran timezone (YYYY-MM-DD)
export function getTehranDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(date); // outputs YYYY-MM-DD
}

// Generate random 6-digit numeric string for employee link code
export function generateLinkCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
