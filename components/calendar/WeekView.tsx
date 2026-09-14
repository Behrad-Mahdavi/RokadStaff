"use client";

import React from "react";
import {
  CalendarGridDay,
  PERSIAN_WEEKDAYS_ORDERED,
  TIMELINE_HOURS,
  TIMELINE_START_HOUR,
  layoutEventsForDay,
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

const SLOT_HEIGHT = 64;

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

          {/* 3. Timetable Grid: 1 column for hours, 7 columns for days */}
          <div className={cn(gridColumnsStyle, "relative")}>
            {/* Left Column: Hourly Labels */}
            <div className="border-l border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/10 select-none">
              {TIMELINE_HOURS.map((hour) => (
                <div
                  key={hour}
                  style={{ height: `${SLOT_HEIGHT}px` }}
                  className="border-b border-gray-200 dark:border-gray-800 text-center font-black text-xs text-ink-normal/60 dark:text-gray-400 flex items-start justify-center pt-2.5"
                >
                  {toPersianDigits(hour)}
                </div>
              ))}
            </div>

            {/* 7 Day Columns with Stretched Events */}
            {weekDays.map((day) => {
              const dayHourly = eventsByDay[day.dateIso]?.hourly || [];
              const positionedEvents = layoutEventsForDay(dayHourly, TIMELINE_START_HOUR, SLOT_HEIGHT);

              return (
                <div
                  key={day.dateIso}
                  className="relative border-l last:border-l-0 border-gray-200 dark:border-gray-800"
                >
                  {/* Background Hour Slots (Clickable) */}
                  {TIMELINE_HOURS.map((hour) => (
                    <div
                      key={hour}
                      onClick={() => onNewEventForSlot(day.dateIso, hour)}
                      style={{ height: `${SLOT_HEIGHT}px` }}
                      className="border-b border-gray-200/80 dark:border-gray-800/80 hover:bg-ecosystem-light/20 dark:hover:bg-gray-800/40 transition-colors group cursor-pointer relative"
                    >
                      <button
                        type="button"
                        className="opacity-0 group-hover:opacity-100 absolute bottom-1 left-1 p-1 rounded-md bg-primary/20 text-primary text-[10px] hover:bg-primary hover:text-white transition-all cursor-pointer pointer-events-none"
                        title="افزودن در این ساعت"
                      >
                        <Plus className="w-3 h-3 stroke-[3]" />
                      </button>
                    </div>
                  ))}

                  {/* Absolute Stretched Events Layer */}
                  <div className="absolute inset-0 pointer-events-none p-1">
                    {positionedEvents.map(({ evt, top, height, column, totalColumns }) => {
                      const eventColor = evt.color || "#59BBAF";
                      const widthPercent = 100 / totalColumns;
                      const rightOffsetPercent = column * widthPercent;

                      return (
                        <div
                          key={evt.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEvent(evt);
                          }}
                          style={{
                            top: `${top}px`,
                            height: `${Math.max(height - 4, 28)}px`,
                            right: `${rightOffsetPercent}%`,
                            width: `calc(${widthPercent}% - 4px)`,
                            borderRightColor: eventColor,
                            backgroundColor: `${eventColor}18`,
                          }}
                          className="absolute pointer-events-auto p-1.5 rounded-xl border-r-4 border border-gray-200/90 dark:border-gray-700/90 shadow-xs hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col justify-between text-right text-sec dark:text-white hover:brightness-95 dark:hover:brightness-110 z-10"
                          title={`${evt.title} (${toPersianDigits(evt.startTime || "")} تا ${toPersianDigits(evt.endTime || "")})`}
                        >
                          <div>
                            <div className="flex items-center justify-between text-[10px] font-black leading-tight gap-1 mb-0.5">
                              <span className="text-sec dark:text-gray-200 truncate">
                                {toPersianDigits(evt.startTime || "")} {evt.endTime ? `- ${toPersianDigits(evt.endTime)}` : ""}
                              </span>
                              <span
                                className="px-1 py-0.2 rounded text-[9px] font-black shrink-0"
                                style={{ color: eventColor }}
                              >
                                {evt.department}
                              </span>
                            </div>

                            <div className="text-xs font-black truncate leading-tight mt-0.5">
                              {evt.title}
                            </div>

                            {evt.location && height > 55 && (
                              <div className="text-[10px] text-ink-normal/60 dark:text-gray-400 truncate flex items-center gap-0.5 mt-0.5 font-medium">
                                <MapPin className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{evt.location}</span>
                              </div>
                            )}
                          </div>

                          {evt.description && height > 90 && (
                            <div className="text-[10px] text-ink-normal/50 dark:text-gray-400 line-clamp-2 mt-1 font-normal leading-relaxed">
                              {evt.description}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
