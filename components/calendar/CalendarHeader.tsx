"use client";

import React from "react";
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Plus,
  Filter,
  Users,
  CalendarDays,
  Clock,
  Briefcase,
  CheckCircle2,
} from "lucide-react";
import { toPersianDigits } from "@/lib/utils";
import { cn } from "@/lib/utils";

export type CalendarViewMode = "month" | "week" | "day";

interface CalendarHeaderProps {
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  title: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  departments: { id: string; name: string }[];
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
  selectedType: "all" | "meeting" | "event";
  onTypeChange: (type: "all" | "meeting" | "event") => void;
  myOnly: boolean;
  onMyOnlyChange: (val: boolean) => void;
  onNewEvent: () => void;
}

export default function CalendarHeader({
  viewMode,
  onViewModeChange,
  title,
  onPrev,
  onNext,
  onToday,
  departments,
  selectedDepartment,
  onDepartmentChange,
  selectedType,
  onTypeChange,
  myOnly,
  onMyOnlyChange,
  onNewEvent,
}: CalendarHeaderProps) {
  return (
    <div className="bg-white dark:bg-[#151C28] rounded-3xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 shadow-[2.75px_2.75px_0_#202A5A] dark:shadow-[2.75px_2.75px_0_#59BBAF] space-y-4">
      {/* Top row: Title & Primary Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-ecosystem-light dark:bg-ecosystem-normal/20 border-2 border-primary text-primary flex items-center justify-center shadow-[2px_2px_0_#202A5A] dark:shadow-[2px_2px_0_#59BBAF] shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-sec dark:text-white flex items-center gap-2">
              تقویم اجرایی سازمان
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30">
                عملیات و رویدادها
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-ink-normal/60 dark:text-gray-400 mt-0.5 font-medium">
              برنامه‌ریزی، مدیریت و پیگیری هوشمند تمامی جلسات کاری و رویدادهای دپارتمان‌ها
            </p>
          </div>
        </div>

        {/* New Event Button */}
        <button
          onClick={onNewEvent}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-ecosystem-normal hover:bg-ecosystem-darker text-white font-bold text-sm shadow-[2.5px_2.5px_0_#202A5A] dark:shadow-[2.5px_2.5px_0_#59BBAF] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>افزودن جلسه یا رویداد</span>
        </button>
      </div>

      {/* Middle row: Date navigation & View mode switch */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800/80">
        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={onNext}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sec dark:text-gray-200 hover:border-primary hover:bg-ecosystem-light dark:hover:bg-gray-700 shadow-sm transition-all"
            title="بازه بعد"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onToday}
            className="px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sec dark:text-gray-200 text-xs font-bold hover:border-primary hover:text-primary transition-all shadow-sm"
          >
            امروز
          </button>

          <button
            onClick={onPrev}
            className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sec dark:text-gray-200 hover:border-primary hover:bg-ecosystem-light dark:hover:bg-gray-700 shadow-sm transition-all"
            title="بازه قبل"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-base sm:text-lg font-black text-sec dark:text-white mr-2 tracking-tight">
            {title}
          </div>
        </div>

        {/* View Mode Toggle (Day / Week / Month) */}
        <div className="flex items-center p-1 bg-gray-100 dark:bg-[#1A2333] rounded-2xl border border-gray-200 dark:border-gray-700 self-start md:self-auto">
          <button
            onClick={() => onViewModeChange("day")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5",
              viewMode === "day"
                ? "bg-white dark:bg-[#151C28] text-sec dark:text-white shadow-sm border border-gray-200 dark:border-gray-700 text-primary"
                : "text-ink-normal/60 dark:text-gray-400 hover:text-sec dark:hover:text-white"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>روزانه</span>
          </button>

          <button
            onClick={() => onViewModeChange("week")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5",
              viewMode === "week"
                ? "bg-white dark:bg-[#151C28] text-sec dark:text-white shadow-sm border border-gray-200 dark:border-gray-700 text-primary"
                : "text-ink-normal/60 dark:text-gray-400 hover:text-sec dark:hover:text-white"
            )}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>هفتگی</span>
          </button>

          <button
            onClick={() => onViewModeChange("month")}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5",
              viewMode === "month"
                ? "bg-white dark:bg-[#151C28] text-sec dark:text-white shadow-sm border border-gray-200 dark:border-gray-700 text-primary"
                : "text-ink-normal/60 dark:text-gray-400 hover:text-sec dark:hover:text-white"
            )}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>ماهانه</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800/80 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/60 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
            <Briefcase className="w-3.5 h-3.5 text-primary" />
            <span className="font-bold text-ink-normal/70 dark:text-gray-300">دپارتمان:</span>
            <select
              value={selectedDepartment}
              onChange={(e) => onDepartmentChange(e.target.value)}
              className="bg-transparent text-sec dark:text-white font-bold outline-none cursor-pointer pr-1"
            >
              <option value="all" className="dark:bg-[#151C28]">همه دپارتمان‌ها</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name} className="dark:bg-[#151C28]">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/60 p-1 rounded-xl border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onTypeChange("all")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold transition-all",
                selectedType === "all"
                  ? "bg-white dark:bg-gray-700 text-primary shadow-xs"
                  : "text-ink-normal/60 dark:text-gray-400 hover:text-sec dark:hover:text-white"
              )}
            >
              همه
            </button>
            <button
              onClick={() => onTypeChange("meeting")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold transition-all",
                selectedType === "meeting"
                  ? "bg-white dark:bg-gray-700 text-sec dark:text-white shadow-xs"
                  : "text-ink-normal/60 dark:text-gray-400 hover:text-sec dark:hover:text-white"
              )}
            >
              جلسات
            </button>
            <button
              onClick={() => onTypeChange("event")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold transition-all",
                selectedType === "event"
                  ? "bg-white dark:bg-gray-700 text-primary shadow-xs"
                  : "text-ink-normal/60 dark:text-gray-400 hover:text-sec dark:hover:text-white"
              )}
            >
              رویدادها
            </button>
          </div>
        </div>

        {/* My Events Toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none font-bold text-sec dark:text-gray-200">
          <input
            type="checkbox"
            checked={myOnly}
            onChange={(e) => onMyOnlyChange(e.target.checked)}
            className="w-4 h-4 rounded-md accent-primary cursor-pointer"
          />
          <span>فقط جلسات و رویدادهای من</span>
        </label>
      </div>
    </div>
  );
}
