"use client";

import React, { useState, useEffect, useRef } from "react";
import jalaali from "jalaali-js";
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  X,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  toPersianDigits,
  PERSIAN_MONTH_NAMES,
  PERSIAN_WEEKDAY_NAMES,
} from "@/lib/utils";

const SHORT_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

interface PersianDatePickerProps {
  value?: string | Date | null; // ISO YYYY-MM-DD string or Date
  onChange: (dateStr: string) => void; // Emits YYYY-MM-DD
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
}

export default function PersianDatePicker({
  value,
  onChange,
  placeholder = "انتخاب تاریخ شمسی...",
  className = "",
  disabled = false,
}: PersianDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Current view year & month in Jalali
  const today = new Date();
  const todayJ = jalaali.toJalaali(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate()
  );

  const [viewYear, setViewYear] = useState<number>(todayJ.jy);
  const [viewMonth, setViewMonth] = useState<number>(todayJ.jm);

  // Parse current value
  let selectedJalali: { jy: number; jm: number; jd: number } | null = null;
  if (value) {
    let d: Date | null = null;
    if (typeof value === "string" && value.trim()) {
      const parts = value.split("T")[0].split("-");
      if (parts.length === 3) {
        d = new Date(
          parseInt(parts[0], 10),
          parseInt(parts[1], 10) - 1,
          parseInt(parts[2], 10)
        );
      }
    } else if (value instanceof Date && !isNaN(value.getTime())) {
      d = value;
    }

    if (d && !isNaN(d.getTime())) {
      selectedJalali = jalaali.toJalaali(
        d.getFullYear(),
        d.getMonth() + 1,
        d.getDate()
      );
    }
  }

  // When value changes, sync view year/month to selected date
  useEffect(() => {
    if (selectedJalali) {
      setViewYear(selectedJalali.jy);
      setViewMonth(selectedJalali.jm);
    }
  }, [value]);

  // Outside click listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Navigate months
  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewMonth(12);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewMonth(1);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Day selection
  const handleSelectDay = (day: number) => {
    const g = jalaali.toGregorian(viewYear, viewMonth, day);
    const mm = String(g.gm).padStart(2, "0");
    const dd = String(g.gd).padStart(2, "0");
    const isoString = `${g.gy}-${mm}-${dd}`;
    onChange(isoString);
    setIsOpen(false);
  };

  // Quick Today selection
  const handleSelectToday = () => {
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    const isoString = `${today.getFullYear()}-${mm}-${dd}`;
    onChange(isoString);
    setViewYear(todayJ.jy);
    setViewMonth(todayJ.jm);
    setIsOpen(false);
  };

  // Clear date
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  // Calculate calendar grid
  const monthLength = jalaali.jalaaliMonthLength(viewYear, viewMonth);
  const firstDayGregorian = jalaali.toGregorian(viewYear, viewMonth, 1);
  const firstDayDate = new Date(
    firstDayGregorian.gy,
    firstDayGregorian.gm - 1,
    firstDayGregorian.gd
  );
  // 0=Sat, 1=Sun, ..., 6=Fri
  const firstDayWeekday = (firstDayDate.getDay() + 1) % 7;

  // Format display text in input
  const displayText = selectedJalali
    ? `${toPersianDigits(selectedJalali.jd)} ${
        PERSIAN_MONTH_NAMES[selectedJalali.jm - 1]
      } ${toPersianDigits(selectedJalali.jy)}`
    : "";

  return (
    <div ref={containerRef} className={`relative font-vazirmatn ${className}`} dir="rtl">
      {/* Input Field Trigger */}
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border transition-all cursor-pointer select-none ${
          disabled
            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
            : isOpen
            ? "border-primary ring-2 ring-primary/20 bg-white shadow-sm"
            : "border-[#DFDFDF] hover:border-primary/60 bg-white"
        }`}
      >
        <div className="flex items-center gap-2.5 overflow-hidden">
          <CalendarIcon
            className={`w-4 h-4 shrink-0 transition-colors ${
              displayText ? "text-primary font-bold" : "text-ink-normal/40"
            }`}
          />
          <span
            className={`text-xs sm:text-sm font-bold truncate ${
              displayText ? "text-sec" : "text-ink-normal/40 font-medium"
            }`}
          >
            {displayText || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {displayText && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-lg text-ink-normal/40 hover:text-female-normal hover:bg-female-light transition-colors"
              title="پاک کردن تاریخ"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Calendar Dropdown Popup */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 z-50 bg-white rounded-2xl border-2 border-primary/30 shadow-[4px_4px_0_#202A5A] p-4 w-72 sm:w-80 animate-in fade-in zoom-in-95 duration-150">
          {/* Header Month / Year controls */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-8 h-8 rounded-xl border border-gray-200 hover:border-primary hover:bg-ecosystem-light text-sec flex items-center justify-center transition-colors"
              title="ماه قبل"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-sm font-black text-sec">
              <span>{PERSIAN_MONTH_NAMES[viewMonth - 1]}</span>
              <span>{toPersianDigits(viewYear)}</span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="w-8 h-8 rounded-xl border border-gray-200 hover:border-primary hover:bg-ecosystem-light text-sec flex items-center justify-center transition-colors"
              title="ماه بعد"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {SHORT_WEEKDAYS.map((name, idx) => (
              <div
                key={idx}
                className={`text-[11px] font-black py-1 ${
                  idx === 6 ? "text-female-normal" : "text-ink-normal/60"
                }`}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {/* Empty slots before day 1 */}
            {Array.from({ length: firstDayWeekday }).map((_, idx) => (
              <div key={`empty-${idx}`} className="w-8 h-8 sm:w-9 sm:h-9" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: monthLength }).map((_, idx) => {
              const day = idx + 1;
              const isSelected =
                selectedJalali &&
                selectedJalali.jy === viewYear &&
                selectedJalali.jm === viewMonth &&
                selectedJalali.jd === day;

              const isToday =
                todayJ.jy === viewYear &&
                todayJ.jm === viewMonth &&
                todayJ.jd === day;

              const isFriday = (firstDayWeekday + idx) % 7 === 6;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center transition-all ${
                    isSelected
                      ? "bg-primary text-white shadow-[2px_2px_0_#202A5A] font-black scale-105"
                      : isToday
                      ? "bg-ecosystem-light text-ecosystem-darker border border-primary/50 font-black"
                      : isFriday
                      ? "text-female-normal hover:bg-female-light/60"
                      : "text-sec hover:bg-gray-100 hover:text-ink-normal"
                  }`}
                >
                  {toPersianDigits(day)}
                </button>
              );
            })}
          </div>

          {/* Footer Quick Actions */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
            <button
              type="button"
              onClick={handleSelectToday}
              className="px-3 py-1.5 rounded-xl bg-ecosystem-light text-ecosystem-darker hover:bg-ecosystem-normal/20 text-xs font-black transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>انتخاب امروز</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-ink-normal/60 hover:text-sec hover:bg-gray-100 transition-colors"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
