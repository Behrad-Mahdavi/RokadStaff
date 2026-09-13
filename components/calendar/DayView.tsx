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
  CheckCircle2,
  AlertCircle,
  FileText,
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
      <div className="bg-white dark:bg-[#151C28] rounded-3xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5 shadow-[2.75px_2.75px_0_#202A5A] dark:shadow-[2.75px_2.75px_0_#59BBAF] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-sec dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>{formattedDateTitle}</span>
          </h2>
          <p className="text-xs sm:text-sm text-ink-normal/60 dark:text-gray-400 mt-1 font-medium">
            تعداد {toPersianDigits(dayEvents.length)} مورد برنامه‌ریزی‌شده ({toPersianDigits(dayEvents.filter(e => e.type === "meeting").length)} جلسه و {toPersianDigits(dayEvents.filter(e => e.type === "event").length)} رویداد)
          </p>
        </div>

        <button
          onClick={() => onNewEvent()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ecosystem-normal hover:bg-ecosystem-darker text-white font-bold text-xs shadow-[2px_2px_0_#202A5A] dark:shadow-[2px_2px_0_#59BBAF] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>افزودن به این روز</span>
        </button>
      </div>

      {/* All-Day Events Section */}
      {allDayEvents.length > 0 && (
        <div className="bg-white dark:bg-[#151C28] rounded-3xl border border-gray-200 dark:border-gray-800 p-4 shadow-[2px_2px_0_#202A5A] dark:shadow-[2px_2px_0_#59BBAF] space-y-2">
          <div className="text-xs font-black text-sec dark:text-white flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>رویدادهای تمام‌روز ({toPersianDigits(allDayEvents.length)})</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allDayEvents.map((evt) => {
              const eventColor = evt.color || "#59BBAF";
              return (
                <div
                  key={evt.id}
                  onClick={() => onSelectEvent(evt)}
                  style={{ borderRightColor: eventColor }}
                  className="p-3.5 rounded-2xl border-r-4 border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-all cursor-pointer shadow-xs"
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
                  <h3 className="text-sm font-black text-sec dark:text-white">
                    {evt.title}
                  </h3>
                  {evt.description && (
                    <p className="text-xs text-ink-normal/60 dark:text-gray-400 mt-1 line-clamp-1">
                      {evt.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hourly Timeline */}
      <div className="bg-white dark:bg-[#151C28] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-[2.75px_2.75px_0_#202A5A] dark:shadow-[2.75px_2.75px_0_#59BBAF] divide-y divide-gray-200 dark:divide-gray-800 overflow-hidden">
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
              className="flex flex-col sm:flex-row items-start min-h-[75px] hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group"
            >
              {/* Hour Label */}
              <div className="w-full sm:w-24 py-3 px-4 sm:border-l border-gray-200 dark:border-gray-800 font-bold text-xs text-ink-normal/60 dark:text-gray-400 flex items-center justify-between sm:justify-start gap-2 shrink-0">
                <span className="text-sm font-black text-sec dark:text-white">
                  {toPersianDigits(hour)}
                </span>
                <button
                  onClick={() => onNewEvent(hour)}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-primary/10 text-primary text-xs transition-opacity"
                  title="افزودن جلسه در این ساعت"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Slot Events */}
              <div className="flex-1 p-2 sm:p-3 w-full">
                {slotEvents.length === 0 ? (
                  <div
                    onClick={() => onNewEvent(hour)}
                    className="h-full min-h-[40px] rounded-xl border border-dashed border-transparent hover:border-gray-300 dark:hover:border-gray-700 flex items-center justify-start px-3 text-xs text-ink-normal/30 dark:text-gray-600 cursor-pointer"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      + خالی - برای ایجاد جلسه یا رویداد کلیک کنید
                    </span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {slotEvents.map((evt) => {
                      const eventColor = evt.color || "#59BBAF";
                      const isOnline = evt.location?.startsWith("http");

                      return (
                        <div
                          key={evt.id}
                          onClick={() => onSelectEvent(evt)}
                          style={{ borderRightColor: eventColor }}
                          className="p-4 rounded-2xl border-r-[5px] border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A2333] shadow-[2px_2px_0_#202A5A] dark:shadow-[2px_2px_0_#59BBAF] hover:-translate-x-0.5 transition-all cursor-pointer"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className="px-2.5 py-0.5 rounded-full text-xs font-black text-white"
                                style={{ backgroundColor: eventColor }}
                              >
                                {evt.department}
                              </span>

                              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">
                                {evt.type === "meeting" ? "جلسه کاری" : "رویداد سازمانی"}
                              </span>

                              {evt.status === "completed" && (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md">
                                  خاتمه یافته
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1 text-xs font-bold text-sec dark:text-gray-200 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-xl">
                              <Clock className="w-3.5 h-3.5 text-primary" />
                              <span>
                                {toPersianDigits(evt.startTime || "")} تا {toPersianDigits(evt.endTime || "پایان")}
                              </span>
                            </div>
                          </div>

                          <h3 className="text-base font-black text-sec dark:text-white">
                            {evt.title}
                          </h3>

                          {evt.description && (
                            <p className="text-xs text-ink-normal/70 dark:text-gray-300 mt-1.5 leading-relaxed font-medium">
                              {evt.description}
                            </p>
                          )}

                          {/* Footer: Location & Attendees */}
                          <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800/80">
                            {/* Location / Link */}
                            {evt.location ? (
                              <div className="flex items-center gap-1.5 text-xs text-ink-normal/70 dark:text-gray-300 font-bold">
                                {isOnline ? (
                                  <a
                                    href={evt.location}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 text-primary hover:underline bg-ecosystem-light dark:bg-ecosystem-normal/20 px-2.5 py-1 rounded-xl border border-primary/30"
                                  >
                                    <Video className="w-3.5 h-3.5" />
                                    <span>ورود به جلسه آنلاین</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-primary" />
                                    <span>محل: {evt.location}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div />
                            )}

                            {/* Attendees Avatars */}
                            {evt.attendees && evt.attendees.length > 0 && (
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-ink-normal/40 dark:text-gray-500" />
                                <span className="text-xs font-bold text-ink-normal/60 dark:text-gray-400">
                                  {toPersianDigits(evt.attendees.length)} نفر حاضر:
                                </span>
                                <div className="flex items-center -space-x-1.5 space-x-reverse">
                                  {evt.attendees.slice(0, 4).map((att: any, aIdx: number) => (
                                    <div
                                      key={att.id || aIdx}
                                      className="w-6 h-6 rounded-full bg-primary/20 text-primary border-2 border-white dark:border-gray-800 flex items-center justify-center text-[10px] font-black"
                                      title={att.employeeName}
                                    >
                                      {att.employeeName ? att.employeeName[0] : "ع"}
                                    </div>
                                  ))}
                                  {evt.attendees.length > 4 && (
                                    <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 text-sec dark:text-gray-200 border-2 border-white dark:border-gray-800 flex items-center justify-center text-[9px] font-black">
                                      +{toPersianDigits(evt.attendees.length - 4)}
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
