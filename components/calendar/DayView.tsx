"use client";

import React from "react";
import { formatFullJalaliDate } from "@/lib/calendarUtils";
import { toPersianDigits } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  Clock,
  Calendar,
  Users,
  Video,
  MapPin,
  ExternalLink,
  Plus,
} from "lucide-react";

interface DayViewProps {
  currentDateIso: string;
  events: any[];
  onSelectEvent: (event: any) => void;
  onNewEvent: (timeStr?: string) => void;
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

export default function DayView({
  currentDateIso,
  events,
  onSelectEvent,
  onNewEvent,
}: DayViewProps) {
  const dayEvents = events.filter((e) => e.startDate === currentDateIso);
  const allDayEvents = dayEvents.filter((e) => e.isAllDay);
  const hourlyEvents = dayEvents.filter((e) => !e.isAllDay);

  const formattedDateTitle = formatFullJalaliDate(currentDateIso);

  return (
    <div className="space-y-4">
      {/* Day Overview Banner */}
      <div className="bg-white dark:bg-[#151C28] rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 p-3.5 sm:p-5 shadow-[2px_2px_0_#202A5A] sm:shadow-[2.75px_2.75px_0_#202A5A] dark:shadow-[2px_2px_0_#59BBAF] sm:dark:shadow-[2.75px_2.75px_0_#59BBAF] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <Calendar className="w-5 h-5 text-primary shrink-0" />
          <h2 className="text-sm sm:text-lg md:text-xl font-black text-sec dark:text-white truncate">
            {formattedDateTitle}
          </h2>
          <span className="hidden sm:inline-flex text-xs font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
            {toPersianDigits(dayEvents.length)} مورد
          </span>
        </div>

        <button
          onClick={() => onNewEvent()}
          className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-ecosystem-normal hover:bg-ecosystem-darker text-white font-bold text-xs shadow-[1.5px_1.5px_0_#202A5A] dark:shadow-[1.5px_1.5px_0_#59BBAF] transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>افزودن</span>
        </button>
      </div>

      {/* All-Day Events Section */}
      {allDayEvents.length > 0 && (
        <div className="bg-white dark:bg-[#151C28] rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 p-3.5 sm:p-4 shadow-[2px_2px_0_#202A5A] dark:shadow-[2px_2px_0_#59BBAF] space-y-2">
          <div className="text-xs font-black text-sec dark:text-white flex items-center gap-2 mb-1.5">
            <Clock className="w-4 h-4 text-primary" />
            <span>رویدادهای تمام‌روز ({toPersianDigits(allDayEvents.length)})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {allDayEvents.map((evt) => {
              const eventColor = evt.color || "#59BBAF";
              return (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent(evt)}
                  style={{ borderRightColor: eventColor }}
                  className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border-r-4 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-black text-white"
                      style={{ backgroundColor: eventColor }}
                    >
                      {evt.department}
                    </span>
                    <span className="text-[11px] font-bold text-ink-normal/60 dark:text-gray-400">
                      تمام روز
                    </span>
                  </div>
                  <h3 className="text-xs sm:text-sm font-black text-sec dark:text-white">
                    {evt.title}
                  </h3>
                  {evt.description && (
                    <p className="text-[11px] sm:text-xs text-ink-normal/60 dark:text-gray-400 mt-1 line-clamp-1">
                      {evt.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hourly Timeline (Always side-by-side on mobile and desktop) */}
      <div className="bg-white dark:bg-[#151C28] rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-[2px_2px_0_#202A5A] sm:shadow-[2.75px_2.75px_0_#202A5A] dark:shadow-[2px_2px_0_#59BBAF] sm:dark:shadow-[2.75px_2.75px_0_#59BBAF] divide-y divide-gray-200 dark:divide-gray-800 overflow-hidden">
        {HOURS.map((hour) => {
          const hourNum = parseInt(hour.split(":")[0], 10);
          const slotEvents = hourlyEvents.filter((evt) => {
            if (!evt.startTime) return false;
            const evtHour = parseInt(evt.startTime.split(":")[0], 10);
            return evtHour === hourNum;
          });

          return (
            <div
              key={hour}
              className="flex items-stretch min-h-[64px] hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group"
            >
              {/* Hour Label (Compact on mobile, comfortable on desktop) */}
              <div className="w-14 sm:w-24 py-2.5 px-1 sm:px-3 border-l border-gray-200 dark:border-gray-800 flex flex-col items-center justify-start pt-3 shrink-0 select-none bg-gray-50/30 dark:bg-gray-900/10">
                <span className="text-xs sm:text-sm font-black text-sec dark:text-white">
                  {toPersianDigits(hour)}
                </span>
                <button
                  onClick={() => onNewEvent(hour)}
                  className="opacity-0 group-hover:opacity-100 mt-1 p-0.5 rounded hover:bg-primary/20 text-primary transition-opacity cursor-pointer"
                  title="افزودن در این ساعت"
                >
                  <Plus className="w-3 h-3 stroke-[3]" />
                </button>
              </div>

              {/* Slot Events Area */}
              <div className="flex-1 p-1.5 sm:p-3 min-w-0">
                {slotEvents.length === 0 ? (
                  <div
                    onClick={() => onNewEvent(hour)}
                    className="h-full min-h-[44px] rounded-xl border border-dashed border-transparent hover:border-gray-300 dark:hover:border-gray-700 flex items-center justify-start px-2 sm:px-3 text-xs text-ink-normal/30 dark:text-gray-600 cursor-pointer"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px]">
                      + بدون برنامه
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {slotEvents.map((evt) => {
                      const eventColor = evt.color || "#59BBAF";
                      const isOnline = evt.location?.startsWith("http");

                      return (
                        <div
                          key={evt.id}
                          onClick={() => onSelectEvent(evt)}
                          style={{ borderRightColor: eventColor }}
                          className="p-3 sm:p-4 rounded-xl sm:rounded-2xl border-r-4 sm:border-r-[5px] border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A2333] shadow-xs hover:shadow-sm transition-all cursor-pointer"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="px-2 py-0.5 rounded-full text-[10px] font-black text-white"
                                style={{ backgroundColor: eventColor }}
                              >
                                {evt.department}
                              </span>

                              <span className="text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md">
                                {evt.type === "meeting" ? "جلسه کاری" : "رویداد سازمانی"}
                              </span>
                            </div>

                            <div className="flex items-center gap-1 text-[11px] font-black text-sec dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg">
                              <Clock className="w-3 h-3 text-primary" />
                              <span>
                                {toPersianDigits(evt.startTime || "")} تا {toPersianDigits(evt.endTime || "پایان")}
                              </span>
                            </div>
                          </div>

                          <h3 className="text-xs sm:text-sm font-black text-sec dark:text-white">
                            {evt.title}
                          </h3>

                          {evt.description && (
                            <p className="text-[11px] sm:text-xs text-ink-normal/70 dark:text-gray-300 mt-1 leading-relaxed font-medium line-clamp-2">
                              {evt.description}
                            </p>
                          )}

                          {/* Footer: Location & Attendees */}
                          <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-800/80 text-[11px]">
                            {/* Location / Link */}
                            {evt.location ? (
                              <div className="flex items-center gap-1 text-ink-normal/70 dark:text-gray-300 font-bold min-w-0">
                                {isOnline ? (
                                  <a
                                    href={evt.location}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 text-primary hover:underline bg-ecosystem-light dark:bg-ecosystem-normal/20 px-2 py-0.5 rounded-lg"
                                  >
                                    <Video className="w-3 h-3" />
                                    <span>لینک جلسه</span>
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                ) : (
                                  <div className="flex items-center gap-1 truncate">
                                    <MapPin className="w-3 h-3 text-primary shrink-0" />
                                    <span className="truncate">{evt.location}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div />
                            )}

                            {/* Attendees */}
                            {evt.attendees && evt.attendees.length > 0 && (
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-ink-normal/40 dark:text-gray-500" />
                                <span className="text-[10px] font-bold text-ink-normal/60 dark:text-gray-400">
                                  {toPersianDigits(evt.attendees.length)} حاضر:
                                </span>
                                <div className="flex items-center -space-x-1 space-x-reverse">
                                  {evt.attendees.slice(0, 3).map((att: any, aIdx: number) => (
                                    <div
                                      key={att.id || aIdx}
                                      className="w-5 h-5 rounded-full bg-primary/20 text-primary border border-white dark:border-gray-800 flex items-center justify-center text-[9px] font-black"
                                      title={att.employeeName}
                                    >
                                      {att.employeeName ? att.employeeName[0] : "ع"}
                                    </div>
                                  ))}
                                  {evt.attendees.length > 3 && (
                                    <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-sec dark:text-gray-200 border border-white dark:border-gray-800 flex items-center justify-center text-[8px] font-black">
                                      +{toPersianDigits(evt.attendees.length - 3)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
