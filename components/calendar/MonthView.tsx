"use client";

import React from "react";
import {
  CalendarGridDay,
  PERSIAN_WEEKDAYS_ORDERED,
} from "@/lib/calendarUtils";
import { toPersianDigits } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Users, Clock, Video, MapPin, Plus } from "lucide-react";

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

  return (
    <div className="bg-white dark:bg-[#151C28] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-[2.75px_2.75px_0_#202A5A] dark:shadow-[2.75px_2.75px_0_#59BBAF] overflow-hidden">
      {/* 7 Weekday Headers (Saturday to Friday) */}
      <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-800 bg-[#F5F7FA] dark:bg-[#1A2333] text-center font-black text-xs sm:text-sm text-sec dark:text-gray-200">
        {PERSIAN_WEEKDAYS_ORDERED.map((wd, idx) => (
          <div
            key={idx}
            className={cn(
              "py-3 px-1 border-l last:border-l-0 border-gray-200 dark:border-gray-800",
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

          return (
            <div
              key={`${day.dateIso}-${idx}`}
              className={cn(
                "min-h-[110px] sm:min-h-[135px] p-1.5 sm:p-2.5 transition-colors flex flex-col justify-between group relative",
                !day.isCurrentMonth
                  ? "bg-gray-50/70 dark:bg-gray-900/30 text-gray-400 dark:text-gray-600"
                  : day.isWeekend
                  ? "bg-rose-50/20 dark:bg-rose-950/10 hover:bg-rose-50/40"
                  : "bg-white dark:bg-[#151C28] hover:bg-ecosystem-light/20 dark:hover:bg-gray-800/40"
              )}
            >
              {/* Day Header: Number + Quick Add */}
              <div className="flex items-center justify-between mb-1.5">
                <span
                  onClick={() => onSelectDate(day.dateIso)}
                  className={cn(
                    "w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm cursor-pointer transition-all",
                    day.isToday
                      ? "bg-primary text-white shadow-[1.5px_1.5px_0_#202A5A] dark:shadow-[1.5px_1.5px_0_#fff]"
                      : day.isCurrentMonth
                      ? "text-sec dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                      : "text-gray-400 dark:text-gray-600"
                  )}
                  title={day.isToday ? "امروز" : "مشاهده نمای روزانه"}
                >
                  {toPersianDigits(day.jd)}
                </span>

                {/* Quick Add Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNewEventForDate(day.dateIso);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-primary/10 hover:text-primary text-gray-400 transition-all"
                  title="افزودن رویداد در این روز"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Event Chips */}
              <div className="space-y-1 flex-1 overflow-hidden">
                {visibleEvents.map((evt) => {
                  const eventColor = evt.color || "#59BBAF";
                  const isMeeting = evt.type === "meeting";

                  return (
                    <div
                      key={evt.id}
                      onClick={() => onSelectEvent(evt)}
                      style={{
                        borderRightColor: eventColor,
                      }}
                      className="cursor-pointer text-[11px] sm:text-xs font-bold px-2 py-1 rounded-lg border-r-4 shadow-xs truncate transition-transform hover:-translate-x-0.5 active:translate-x-0 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-700/80 text-sec dark:text-gray-100 flex items-center gap-1.5"
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
                    onClick={() => onSelectDate(day.dateIso)}
                    className="w-full text-center text-[10px] font-black text-primary hover:underline pt-0.5"
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
  );
}
