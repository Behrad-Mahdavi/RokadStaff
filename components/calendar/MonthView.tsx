"use client";

import React, { useState } from "react";
import {
  CalendarGridDay,
  PERSIAN_WEEKDAYS_ORDERED,
  formatFullJalaliDate,
} from "@/lib/calendarUtils";
import { toPersianDigits } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Clock, Plus, MapPin, Calendar, ExternalLink } from "lucide-react";

interface MonthViewProps {
  days: CalendarGridDay[];
  events: any[];
  onSelectEvent: (event: any) => void;
  onSelectDate: (dateIso: string) => void;
  onNewEventForDate: (dateIso: string) => void;
}

export default function MonthView({
  days,
  events,
  onSelectEvent,
  onSelectDate,
  onNewEventForDate,
}: MonthViewProps) {
  // Group events by startDate
  const eventsByDate = React.useMemo(() => {
    const map: Record<string, any[]> = {};
    for (const evt of events) {
      const dateKey = evt.startDate;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(evt);
    }
    return map;
  }, [events]);

  // Selected date on mobile to display the agenda below the calendar
  const todayItem = days.find((d) => d.isToday) || days[0];
  const [selectedMobileDate, setSelectedMobileDate] = useState<string>(
    todayItem?.dateIso || new Date().toISOString().split("T")[0]
  );

  const selectedDayEvents = eventsByDate[selectedMobileDate] || [];

  return (
    <div className="space-y-4">
      {/* Calendar Matrix Card */}
      <div className="bg-white dark:bg-[#151C28] rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-[2px_2px_0_#202A5A] sm:shadow-[2.75px_2.75px_0_#202A5A] dark:shadow-[2px_2px_0_#59BBAF] sm:dark:shadow-[2.75px_2.75px_0_#59BBAF] overflow-hidden">
        {/* 7 Weekday Headers (Saturday to Friday) */}
        <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-[#F5F7FA] dark:bg-[#1A2333] text-center font-black text-[11px] sm:text-sm text-sec dark:text-gray-200">
          {PERSIAN_WEEKDAYS_ORDERED.map((wd, idx) => (
            <div
              key={idx}
              className={cn(
                "py-2 sm:py-3 px-1 border-l last:border-l-0 border-gray-200 dark:border-gray-800",
                idx === 6 ? "text-female-normal dark:text-pink-400 bg-pink-50/50 dark:bg-pink-950/20" : ""
              )}
            >
              <span className="hidden sm:inline">{wd.name}</span>
              <span className="sm:hidden">{wd.short}</span>
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-x-reverse divide-y divide-gray-200 dark:divide-gray-800">
          {days.map((day, idx) => {
            const dayEvents = eventsByDate[day.dateIso] || [];
            const visibleEvents = dayEvents.slice(0, 3);
            const hiddenCount = dayEvents.length - 3;
            const isSelectedOnMobile = day.dateIso === selectedMobileDate;

            return (
              <div
                key={`${day.dateIso}-${idx}`}
                onClick={() => {
                  setSelectedMobileDate(day.dateIso);
                }}
                className={cn(
                  "min-h-[58px] sm:min-h-[135px] p-1 sm:p-2.5 transition-colors flex flex-col justify-between group relative cursor-pointer sm:cursor-default",
                  !day.isCurrentMonth
                    ? "bg-gray-50/70 dark:bg-gray-900/30 text-gray-400 dark:text-gray-600"
                    : day.isWeekend
                    ? "bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/40"
                    : "bg-white dark:bg-[#151C28] hover:bg-ecosystem-light/20 dark:hover:bg-gray-800/40",
                  isSelectedOnMobile
                    ? "ring-2 ring-inset ring-primary sm:ring-0 bg-primary/5 dark:bg-primary/10"
                    : ""
                )}
              >
                {/* Day Header: Number + Quick Add */}
                <div className="flex items-center justify-between">
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDate(day.dateIso);
                    }}
                    className={cn(
                      "w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-xs sm:text-sm cursor-pointer transition-all",
                      day.isToday
                        ? "bg-primary text-white shadow-[1px_1px_0_#202A5A] dark:shadow-[1px_1px_0_#fff]"
                        : isSelectedOnMobile
                        ? "bg-primary/20 text-primary font-black"
                        : day.isCurrentMonth
                        ? "text-sec dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                        : "text-gray-400 dark:text-gray-600"
                    )}
                    title={day.isToday ? "امروز" : "مشاهده نمای روزانه"}
                  >
                    {toPersianDigits(day.jd)}
                  </span>

                  {/* Quick Add Button (Desktop only) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNewEventForDate(day.dateIso);
                    }}
                    className="hidden sm:block opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-primary/10 hover:text-primary text-gray-400 transition-all cursor-pointer"
                    title="افزودن رویداد در این روز"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Mobile View: Event Indicator Dots */}
                <div className="flex sm:hidden items-center justify-center gap-1 mt-1 flex-wrap">
                  {dayEvents.slice(0, 3).map((evt) => (
                    <span
                      key={evt.id}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: evt.color || "#59BBAF" }}
                    />
                  ))}
                  {dayEvents.length > 3 && (
                    <span className="text-[9px] font-black text-primary leading-none">
                      +{toPersianDigits(dayEvents.length - 3)}
                    </span>
                  )}
                </div>

                {/* Desktop View: Event Chips with Title and Time */}
                <div className="hidden sm:block space-y-1 flex-1 overflow-hidden mt-1.5">
                  {visibleEvents.map((evt) => {
                    const eventColor = evt.color || "#59BBAF";

                    return (
                      <div
                        key={evt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectEvent(evt);
                        }}
                        style={{
                          borderRightColor: eventColor,
                        }}
                        className="cursor-pointer text-[11px] font-bold px-2 py-1 rounded-lg border-r-4 shadow-xs truncate transition-transform hover:-translate-x-0.5 active:translate-x-0 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700/80 text-sec dark:text-gray-100 flex items-center gap-1.5"
                        title={`${evt.title} (${evt.startTime || "تمام روز"})`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ backgroundColor: eventColor }}
                        />
                        {evt.startTime && (
                          <span className="text-[10px] text-ink-normal/60 dark:text-gray-400 shrink-0 font-medium">
                            {toPersianDigits(evt.startTime)}
                          </span>
                        )}
                        <span className="truncate">{evt.title}</span>
                      </div>
                    );
                  })}

                  {hiddenCount > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDate(day.dateIso);
                      }}
                      className="w-full text-center text-[10px] font-black text-primary hover:underline pt-0.5 cursor-pointer"
                    >
                      + {toPersianDigits(hiddenCount)} مورد دیگر
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile Only: Agenda card for selected day */}
      <div className="block sm:hidden bg-white dark:bg-[#151C28] rounded-2xl border border-gray-200 dark:border-gray-800 p-4 shadow-[2px_2px_0_#202A5A] dark:shadow-[2px_2px_0_#59BBAF] space-y-3">
        <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-xs font-black text-sec dark:text-white">
              {formatFullJalaliDate(selectedMobileDate)}
            </span>
          </div>

          <button
            onClick={() => onNewEventForDate(selectedMobileDate)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ecosystem-normal text-white text-[11px] font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن</span>
          </button>
        </div>

        {selectedDayEvents.length === 0 ? (
          <div className="py-6 text-center text-xs text-ink-normal/50 dark:text-gray-400 font-medium">
            رویداد یا جلسه‌ای برای این روز ثبت نشده است.
          </div>
        ) : (
          <div className="space-y-2">
            {selectedDayEvents.map((evt) => {
              const eventColor = evt.color || "#59BBAF";
              const isOnline = evt.location?.startsWith("http");

              return (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent(evt)}
                  style={{ borderRightColor: eventColor }}
                  className="p-3 rounded-xl border-r-4 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="px-2 py-0.5 rounded-md text-[10px] font-black text-white"
                      style={{ backgroundColor: eventColor }}
                    >
                      {evt.department}
                    </span>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-ink-normal/70 dark:text-gray-300">
                      <Clock className="w-3 h-3 text-primary" />
                      <span>
                        {evt.isAllDay
                          ? "تمام روز"
                          : `${toPersianDigits(evt.startTime || "")} تا ${toPersianDigits(evt.endTime || "")}`}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-black text-sec dark:text-white">
                    {evt.title}
                  </div>

                  {evt.location && (
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-ink-normal/60 dark:text-gray-400">
                      <MapPin className="w-3 h-3 text-primary shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
