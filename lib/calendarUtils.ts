import jalaali from "jalaali-js";
import { toPersianDigits, PERSIAN_MONTH_NAMES } from "./utils";

export const PERSIAN_WEEKDAYS_ORDERED = [
  { name: "شنبه", short: "ش", jsDay: 6 },
  { name: "یکشنبه", short: "ی", jsDay: 0 },
  { name: "دوشنبه", short: "د", jsDay: 1 },
  { name: "سه‌شنبه", short: "س", jsDay: 2 },
  { name: "چهارشنبه", short: "چ", jsDay: 3 },
  { name: "پنج‌شنبه", short: "پ", jsDay: 4 },
  { name: "جمعه", short: "ج", jsDay: 5 },
];

export const CALENDAR_COLORS = [
  { hex: "#59BBAF", name: "اکوسیستم (فیروزه‌ای)" },
  { hex: "#202A5A", name: "پسرانه (سرمه‌ای)" },
  { hex: "#E0195B", name: "دخترانه (سرخابی)" },
  { hex: "#F8A41D", name: "کالج (طلایی)" },
  { hex: "#652D90", name: "باشگاه (بنفش)" },
  { hex: "#10B981", name: "زمردی" },
  { hex: "#6366F1", name: "نیلی" },
  { hex: "#EC4899", name: "صورتی" },
];

export function getJalaliToday() {
  const now = new Date();
  return jalaali.toJalaali(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function jalaliToIso(jy: number, jm: number, jd: number): string {
  const g = jalaali.toGregorian(jy, jm, jd);
  const mm = String(g.gm).padStart(2, "0");
  const dd = String(g.gd).padStart(2, "0");
  return `${g.gy}-${mm}-${dd}`;
}

export function isoToJalali(isoStr: string): { jy: number; jm: number; jd: number } {
  if (!isoStr) return getJalaliToday();
  const parts = isoStr.split("T")[0].split("-");
  if (parts.length !== 3) return getJalaliToday();
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  return jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

export function isSameDay(iso1: string, iso2: string): boolean {
  if (!iso1 || !iso2) return false;
  return iso1.split("T")[0] === iso2.split("T")[0];
}

export interface CalendarGridDay {
  jy: number;
  jm: number;
  jd: number;
  dateIso: string;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean; // Friday
  weekdayIndex: number; // 0=Sat, ..., 6=Fri
}

// Generate full monthly grid (always complete weeks from Saturday to Friday)
export function getMonthGrid(year: number, month: number): CalendarGridDay[] {
  const today = getJalaliToday();
  const todayIso = jalaliToIso(today.jy, today.jm, today.jd);

  const monthLength = jalaali.jalaaliMonthLength(year, month);
  const firstDayGregorian = jalaali.toGregorian(year, month, 1);
  const firstDayDate = new Date(firstDayGregorian.gy, firstDayGregorian.gm - 1, firstDayGregorian.gd);
  // In JS: 0=Sun, 1=Mon, ..., 6=Sat. In Persian: Sat is 0, Sun is 1, ..., Fri is 6.
  const firstDayOffset = (firstDayDate.getDay() + 1) % 7;

  const days: CalendarGridDay[] = [];

  // Previous month padding days
  if (firstDayOffset > 0) {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevMonthLength = jalaali.jalaaliMonthLength(prevYear, prevMonth);

    for (let i = firstDayOffset - 1; i >= 0; i--) {
      const dayNum = prevMonthLength - i;
      const iso = jalaliToIso(prevYear, prevMonth, dayNum);
      const weekdayIdx = (firstDayOffset - 1 - i) % 7;
      days.push({
        jy: prevYear,
        jm: prevMonth,
        jd: dayNum,
        dateIso: iso,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        isWeekend: weekdayIdx === 6,
        weekdayIndex: weekdayIdx,
      });
    }
  }

  // Current month days
  for (let d = 1; d <= monthLength; d++) {
    const iso = jalaliToIso(year, month, d);
    const g = jalaali.toGregorian(year, month, d);
    const dateObj = new Date(g.gy, g.gm - 1, g.gd);
    const weekdayIdx = (dateObj.getDay() + 1) % 7;
    days.push({
      jy: year,
      jm: month,
      jd: d,
      dateIso: iso,
      isCurrentMonth: true,
      isToday: iso === todayIso,
      isWeekend: weekdayIdx === 6,
      weekdayIndex: weekdayIdx,
    });
  }

  // Next month padding days to complete grid to a multiple of 7
  const remaining = (7 - (days.length % 7)) % 7;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  for (let d = 1; d <= remaining; d++) {
    const iso = jalaliToIso(nextYear, nextMonth, d);
    const g = jalaali.toGregorian(nextYear, nextMonth, d);
    const dateObj = new Date(g.gy, g.gm - 1, g.gd);
    const weekdayIdx = (dateObj.getDay() + 1) % 7;
    days.push({
      jy: nextYear,
      jm: nextMonth,
      jd: d,
      dateIso: iso,
      isCurrentMonth: false,
      isToday: iso === todayIso,
      isWeekend: weekdayIdx === 6,
      weekdayIndex: weekdayIdx,
    });
  }

  return days;
}

// Generate the 7 days of the current week (starting Saturday) containing baseIso
export function getWeekDays(baseIso: string): CalendarGridDay[] {
  const today = getJalaliToday();
  const todayIso = jalaliToIso(today.jy, today.jm, today.jd);

  const parts = baseIso.split("-");
  const baseDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));

  // Offset from Saturday: (day + 1) % 7
  const dayOfWeek = (baseDate.getDay() + 1) % 7; // 0=Sat, 1=Sun, ..., 6=Fri

  // Start on Saturday
  const saturday = new Date(baseDate);
  saturday.setDate(baseDate.getDate() - dayOfWeek);

  const week: CalendarGridDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(saturday);
    d.setDate(saturday.getDate() + i);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const iso = `${d.getFullYear()}-${mm}-${dd}`;
    const j = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());

    week.push({
      jy: j.jy,
      jm: j.jm,
      jd: j.jd,
      dateIso: iso,
      isCurrentMonth: true,
      isToday: iso === todayIso,
      isWeekend: i === 6,
      weekdayIndex: i,
    });
  }

  return week;
}

export function formatPersianMonthYear(jy: number, jm: number): string {
  return `${PERSIAN_MONTH_NAMES[jm - 1]} ${toPersianDigits(jy)}`;
}

export function formatFullJalaliDate(isoStr: string): string {
  const j = isoToJalali(isoStr);
  const parts = isoStr.split("-");
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const weekday = PERSIAN_WEEKDAYS_ORDERED[(d.getDay() + 1) % 7].name;
  return `${weekday} ${toPersianDigits(j.jd)} ${PERSIAN_MONTH_NAMES[j.jm - 1]} ${toPersianDigits(j.jy)}`;
}
