"use client";

import React from "react";
import {
  CalendarGridDay,
  PERSIAN_WEEKDAYS_ORDERED,
} from "@/lib/calendarUtils";
import { toPersianDigits } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Clock, Plus, MapPin } from "lucide-react";

interface WeekViewProps {
  weekDays: CalendarGridDay[];
  events: any[];
  onSelectEvent: (event: any) => void;
  onNewEventForSlot: (dateIso: string, timeStr?: string) => void;
}

const HOURS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

export default function WeekView({
  weekDays,
  events,
  onSelectEvent,
  onNewEventForSlot,
}: WeekViewProps) {
  // Filter all-day events vs hourly events
  const eventsByDay = React.useMemo(() => {
    const map: Record<string, { allDay: any[]; hourly: any[] }> = {};
    for (const d of weekDays) {
      map[d.dateIso] = { allDay: [], hourly: [] };
    }

    for (const evt of events) {
      const dateKey = evt.startDate;
      if (map[dateKey]) {
        if (evt.isAllDay) {
          map[dateKey].allDay.push(evt);
        } else {
          map[dateKey].hourly.push(evt);
        }
      }
    }
    return map;
  }, [events, weekDays]);

  // Unified grid column definition for 100% aligned borders across header and all rows
  const gridColumnsStyle = "grid grid-cols-[70px_repeat(7,minmax(120px,1fr))]";

  return (
    <div className="bg-white dark:bg-[#151C28] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-[2.75px_2.75px_0_#202A5A] dark:shadow-[2.75px_2.75px_0_#59BBAF] overflow-hidden">
      {/* Scroll container wrapping header and content together to guarantee 100% border alignment */}
      <div className="overflow-x-auto max-h-[720px] overflow-y-auto">
        <div className="min-w-[920px]">
          {/* 1. Week Days Sticky Header */}
          <div className={cn(gridColumnsStyle, "sticky top-0 z-20 bg-[#F5F7FA] dark:bg-[#1A2333] border-b border-gray-200 dark:border-gray-800")}>
            {/* Time label column header */}
            <div className="py-3 px-2 border-l border-gray-200 dark:border-gray-800 text-center font-black text-xs text-ink-normal/60 dark:text-gray-400 flex items-center justify-center bg-[#F5F7FA] dark:bg-[#1A2333]">
              <Clock className="w-3.5 h-3.5 ml-1 text-primary" />
              <span>ساعت</span>
            </div>

            {/* 7 Days Headers (Saturday to Friday) */}
            {weekDays.map((day, idx) => (
              <div
                key={day.dateIso}
                className={cn(
                  "py-2.5 px-2 border-l last:border-l-0 border-gray-200 dark:border-gray-800 text-center transition-colors bg-[#F5F7FA] dark:bg-[#1A2333]",
                  day.isToday ? "bg-primary/10 dark:bg-primary/20" : "",
                  day.isWeekend ? "bg-rose-50/50 dark:bg-rose-950/20 text-female-normal dark:text-pink-400" : ""
                )}
              >
                <div className="text-xs font-black text-sec dark:text-gray-200">
                  {PERSIAN_WEEKDAYS_ORDERED[idx].name}
                </div>
                <div className="mt-0.5 flex items-center justify-center">
                  <span
                    className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs",
                      day.isToday
                        ? "bg-primary text-white shadow-[1.5px_1.5px_0_#202A5A] dark:shadow-[1.5px_1.5px_0_#fff]"
                        : "text-ink-normal/70 dark:text-gray-300"
                    )}
                  >
                    {toPersianDigits(day.jd)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* 2. All-Day Events Row */}
          <div className={cn(gridColumnsStyle, "border-b border-gray-200 dark:border-gray-800 bg-gray-50/40 dark:bg-gray-900/20")}>
            <div className="py-2 px-2 border-l border-gray-200 dark:border-gray-800 text-center font-bold text-[11px] text-ink-normal/60 dark:text-gray-400 flex items-center justify-center">
              تمام روز
            </div>
            {weekDays.map((day) => {
              const dayAllDay = eventsByDay[day.dateIso]?.allDay || [];
              return (
                <div
                  key={`allday-${day.dateIso}`}
                  className="py-1.5 px-1.5 border-l last:border-l-0 border-gray-200 dark:border-gray-800 min-h-[38px] space-y-1"
                >
                  {dayAllDay.map((evt) => (
                    <div
                      key={evt.id}
                      onClick={() => onSelectEvent(evt)}
                      style={{ backgroundColor: `${evt.color}20`, borderColor: evt.color }}
                      className="px-2 py-0.5 rounded-lg border text-[11px] font-black text-sec dark:text-gray-200 truncate cursor-pointer hover:opacity-80 transition-opacity"
                      title={evt.title}
                    >
                      {evt.title}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* 3. Hourly Grid Rows */}
          {HOURS.map((hour, hIdx) => {
            const hourNum = parseInt(hour.split(":")[0], 10);

            return (
              <div
                key={hour}
                className={cn(
                  gridColumnsStyle,
                  "min-h-[64px]",
                  hIdx < HOURS.length - 1 ? "border-b border-gray-200 dark:border-gray-800" : ""
                )}
              >
                {/* Hour Label */}
                <div className="py-2 px-1 border-l border-gray-200 dark:border-gray-800 text-center font-black text-xs text-ink-normal/60 dark:text-gray-400 flex items-start justify-center pt-2.5 select-none bg-gray-50/20 dark:bg-gray-900/10">
                  {toPersianDigits(hour)}
                </div>

                {/* 7 Day Slots for this Hour */}
                {weekDays.map((day) => {
                  const dayHourly = eventsByDay[day.dateIso]?.hourly || [];
                  const slotEvents = dayHourly.filter((evt) => {
                    if (!evt.startTime) return false;
                    const evtHour = parseInt(evt.startTime.split(":")[0], 10);
                    return evtHour === hourNum;
                  });

                  return (
                    <div
                      key={`${day.dateIso}-${hour}`}
                      onClick={() => onNewEventForSlot(day.dateIso, hour)}
                      className="p-1 border-l last:border-l-0 border-gray-200 dark:border-gray-800 relative hover:bg-ecosystem-light/20 dark:hover:bg-gray-800/40 transition-colors group cursor-pointer"
                    >
                      {/* Slot Events */}
                      <div className="space-y-1 h-full">
                        {slotEvents.map((evt) => {
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
                                backgroundColor: `${eventColor}15`,
                              }}
                              className="p-1.5 rounded-xl border-r-4 shadow-xs text-right cursor-pointer hover:shadow-sm transition-all text-sec dark:text-white"
                            >
                              <div className="flex items-center justify-between text-[10px] font-black text-ink-normal/60 dark:text-gray-300">
                                <span>{toPersianDigits(evt.startTime || "")}</span>
                                <span
                                  className="px-1 py-0.2 rounded text-[9px] font-black"
                                  style={{ color: eventColor }}
                                >
                                  {evt.department}
                                </span>
                              </div>
                              <div className="text-xs font-black truncate mt-0.5">
                                {evt.title}
                              </div>
                              {evt.location && (
                                <div className="text-[10px] text-ink-normal/50 dark:text-gray-400 truncate flex items-center gap-1 mt-0.5 font-medium">
                                  <MapPin className="w-2.5 h-2.5 shrink-0" />
                                  <span>{evt.location}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Hover Plus Icon */}
                      <button
                        type="button"
                        className="opacity-0 group-hover:opacity-100 absolute bottom-1 left-1 p-1 rounded-md bg-primary/20 text-primary text-[10px] hover:bg-primary hover:text-white transition-all cursor-pointer"
                        title="افزودن در این ساعت"
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
