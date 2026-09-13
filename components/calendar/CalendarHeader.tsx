"use client";

import React from "react";
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Plus,
  Clock,
  CalendarDays,
  Briefcase,
} from "lucide-react";
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
    <div className="bg-white dark:bg-[#151C28] rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 p-3.5 sm:p-5 shadow-[2px_2px_0_#202A5A] sm:shadow-[2.75px_2.75px_0_#202A5A] dark:shadow-[2px_2px_0_#59BBAF] sm:dark:shadow-[2.75px_2.75px_0_#59BBAF] space-y-3 sm:space-y-4">
      {/* Top row: Title & Primary Action Button */}
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-ecosystem-light dark:bg-ecosystem-normal/20 border-2 border-primary text-primary flex items-center justify-center shadow-[1.5px_1.5px_0_#202A5A] sm:shadow-[2px_2px_0_#202A5A] dark:shadow-[1.5px_1.5px_0_#59BBAF] shrink-0">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl md:text-2xl font-black text-sec dark:text-white truncate">
              تقویم اجرایی سازمان
            </h1>
          </div>
        </div>

        {/* New Event Button (responsive: compact icon+text on mobile) */}
        <button
          onClick={onNewEvent}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl bg-ecosystem-normal hover:bg-ecosystem-darker text-white font-bold text-xs sm:text-sm shadow-[2px_2px_0_#202A5A] dark:shadow-[2px_2px_0_#59BBAF] active:translate-x-0.5 active:translate-y-0.5 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>جلسه / رویداد جدید</span>
        </button>
      </div>

      {/* Middle row: Date navigation & View mode switch */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2.5 sm:pt-3 border-t border-gray-100 dark:border-gray-800/80">
        {/* Navigation Controls */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={onNext}
              className="p-1.5 sm:p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sec dark:text-gray-200 hover:border-primary hover:bg-ecosystem-light dark:hover:bg-gray-700 transition-all cursor-pointer"
              title="بعدی"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={onToday}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sec dark:text-gray-200 text-xs font-bold hover:border-primary hover:text-primary transition-all shadow-xs cursor-pointer"
            >
              امروز
            </button>

            <button
              onClick={onPrev}
              className="p-1.5 sm:p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sec dark:text-gray-200 hover:border-primary hover:bg-ecosystem-light dark:hover:bg-gray-700 transition-all cursor-pointer"
              title="قبلی"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="text-sm sm:text-base md:text-lg font-black text-sec dark:text-white mr-1 sm:mr-2 truncate">
            {title}
          </div>
        </div>

        {/* View Mode Toggle (Day / Week / Month) */}
        <div className="flex items-center justify-center p-1 bg-gray-100 dark:bg-[#1A2333] rounded-xl sm:rounded-2xl border border-gray-200 dark:border-gray-700 shrink-0">
          <button
            onClick={() => onViewModeChange("day")}
            className={cn(
              "flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer",
              viewMode === "day"
                ? "bg-white dark:bg-[#151C28] text-primary shadow-xs border border-gray-200 dark:border-gray-700"
                : "text-ink-normal/60 dark:text-gray-400 hover:text-sec dark:hover:text-white"
            )}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>روزانه</span>
          </button>

          <button
            onClick={() => onViewModeChange("week")}
            className={cn(
              "flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer",
              viewMode === "week"
                ? "bg-white dark:bg-[#151C28] text-primary shadow-xs border border-gray-200 dark:border-gray-700"
                : "text-ink-normal/60 dark:text-gray-400 hover:text-sec dark:hover:text-white"
            )}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>هفتگی</span>
          </button>

          <button
            onClick={() => onViewModeChange("month")}
            className={cn(
              "flex-1 sm:flex-initial px-3 sm:px-3.5 py-1.5 rounded-lg sm:rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer",
              viewMode === "month"
                ? "bg-white dark:bg-[#151C28] text-primary shadow-xs border border-gray-200 dark:border-gray-700"
                : "text-ink-normal/60 dark:text-gray-400 hover:text-sec dark:hover:text-white"
            )}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            <span>ماهانه</span>
          </button>
        </div>
      </div>

      {/* Bottom row: Filters (Horizontally scrollable on mobile for flawless layout) */}
      <div className="flex items-center justify-between gap-3 pt-2.5 sm:pt-3 border-t border-gray-100 dark:border-gray-800/80 text-xs overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-2 shrink-0">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-800/60 px-2.5 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
            <Briefcase className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="font-bold text-ink-normal/70 dark:text-gray-300 shrink-0">دپارتمان:</span>
            <select
              value={selectedDepartment}
              onChange={(e) => onDepartmentChange(e.target.value)}
              className="bg-transparent text-sec dark:text-white font-bold outline-none cursor-pointer pr-1"
            >
              <option value="all" className="dark:bg-[#151C28]">همه</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name} className="dark:bg-[#151C28]">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800/60 p-1 rounded-xl border border-gray-200 dark:border-gray-700 shrink-0">
            <button
              onClick={() => onTypeChange("all")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer",
                selectedType === "all"
                  ? "bg-white dark:bg-gray-700 text-primary shadow-2xs"
                  : "text-ink-normal/60 dark:text-gray-400 hover:text-sec dark:hover:text-white"
              )}
            >
              همه
            </button>
            <button
              onClick={() => onTypeChange("meeting")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer",
                selectedType === "meeting"
                  ? "bg-white dark:bg-gray-700 text-sec dark:text-white shadow-2xs"
                  : "text-ink-normal/60 dark:text-gray-400 hover:text-sec dark:hover:text-white"
              )}
            >
              جلسات
            </button>
            <button
              onClick={() => onTypeChange("event")}
              className={cn(
                "px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer",
                selectedType === "event"
                  ? "bg-white dark:bg-gray-700 text-primary shadow-2xs"
                  : "text-ink-normal/60 dark:text-gray-400 hover:text-sec dark:hover:text-white"
              )}
            >
              رویدادها
            </button>
          </div>
        </div>

        {/* My Events Toggle */}
        <label className="flex items-center gap-1.5 cursor-pointer select-none font-bold text-sec dark:text-gray-200 shrink-0 whitespace-nowrap mr-2">
          <input
            type="checkbox"
            checked={myOnly}
            onChange={(e) => onMyOnlyChange(e.target.checked)}
            className="w-4 h-4 rounded-md accent-primary cursor-pointer"
          />
          <span>جلسات من</span>
        </label>
      </div>
    </div>
  );
}
