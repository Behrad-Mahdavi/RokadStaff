"use client";

import React, { useState, useEffect, useCallback } from "react";
import CalendarHeader, { CalendarViewMode } from "@/components/calendar/CalendarHeader";
import MonthView from "@/components/calendar/MonthView";
import WeekView from "@/components/calendar/WeekView";
import DayView from "@/components/calendar/DayView";
import EventModal from "@/components/calendar/EventModal";
import {
  getJalaliToday,
  jalaliToIso,
  isoToJalali,
  getMonthGrid,
  getWeekDays,
  formatPersianMonthYear,
  formatFullJalaliDate,
} from "@/lib/calendarUtils";
import { toPersianDigits, PERSIAN_MONTH_NAMES } from "@/lib/utils";
import jalaali from "jalaali-js";
import { Loader2 } from "lucide-react";

export default function CalendarPage() {
  // Current user & context
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  // Calendar date view state
  const todayJ = getJalaliToday();
  const todayIso = jalaliToIso(todayJ.jy, todayJ.jm, todayJ.jd);

  const [viewMode, setViewMode] = useState<CalendarViewMode>("month");
  const [viewYear, setViewYear] = useState<number>(todayJ.jy);
  const [viewMonth, setViewMonth] = useState<number>(todayJ.jm);
  const [currentDateIso, setCurrentDateIso] = useState<string>(todayIso);

  // Filters
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<"all" | "meeting" | "event">("all");
  const [myOnly, setMyOnly] = useState<boolean>(false);

  // Events data
  const [events, setEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [eventToEdit, setEventToEdit] = useState<any | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>(undefined);
  const [modalInitialTime, setModalInitialTime] = useState<string | undefined>(undefined);

  // Load session
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentSession(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Load departments
  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((data) => {
        if (data.departments) {
          setDepartments(data.departments);
        }
      })
      .catch(() => {});
  }, []);

  // Load employees
  useEffect(() => {
    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => {
        if (data.employees) {
          setEmployees(data.employees);
        }
      })
      .catch(() => {});
  }, []);

  // Fetch events based on current view and filters
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();

      if (selectedDepartment !== "all") {
        params.set("department", selectedDepartment);
      }
      if (selectedType !== "all") {
        params.set("type", selectedType);
      }
      if (myOnly) {
        params.set("myOnly", "true");
      }

      const res = await fetch(`/api/calendar/events?${params.toString()}`);
      const data = await res.json();
      if (data.events) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error("Fetch calendar events failed:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDepartment, selectedType, myOnly]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Navigation handlers
  const handlePrev = () => {
    if (viewMode === "month") {
      if (viewMonth === 1) {
        setViewMonth(12);
        setViewYear((y) => y - 1);
      } else {
        setViewMonth((m) => m - 1);
      }
    } else if (viewMode === "week") {
      const parts = currentDateIso.split("-");
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() - 7);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const newIso = `${d.getFullYear()}-${mm}-${dd}`;
      setCurrentDateIso(newIso);
      const j = isoToJalali(newIso);
      setViewYear(j.jy);
      setViewMonth(j.jm);
    } else if (viewMode === "day") {
      const parts = currentDateIso.split("-");
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() - 1);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const newIso = `${d.getFullYear()}-${mm}-${dd}`;
      setCurrentDateIso(newIso);
      const j = isoToJalali(newIso);
      setViewYear(j.jy);
      setViewMonth(j.jm);
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      if (viewMonth === 12) {
        setViewMonth(1);
        setViewYear((y) => y + 1);
      } else {
        setViewMonth((m) => m + 1);
      }
    } else if (viewMode === "week") {
      const parts = currentDateIso.split("-");
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + 7);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const newIso = `${d.getFullYear()}-${mm}-${dd}`;
      setCurrentDateIso(newIso);
      const j = isoToJalali(newIso);
      setViewYear(j.jy);
      setViewMonth(j.jm);
    } else if (viewMode === "day") {
      const parts = currentDateIso.split("-");
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      d.setDate(d.getDate() + 1);
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const newIso = `${d.getFullYear()}-${mm}-${dd}`;
      setCurrentDateIso(newIso);
      const j = isoToJalali(newIso);
      setViewYear(j.jy);
      setViewMonth(j.jm);
    }
  };

  const handleToday = () => {
    const t = getJalaliToday();
    const tIso = jalaliToIso(t.jy, t.jm, t.jd);
    setViewYear(t.jy);
    setViewMonth(t.jm);
    setCurrentDateIso(tIso);
  };

  // Month grid & week grid calculation
  const monthDays = React.useMemo(() => {
    return getMonthGrid(viewYear, viewMonth);
  }, [viewYear, viewMonth]);

  const weekDays = React.useMemo(() => {
    return getWeekDays(currentDateIso);
  }, [currentDateIso]);

  // Compute header title based on active view mode
  const headerTitle = React.useMemo(() => {
    if (viewMode === "month") {
      return formatPersianMonthYear(viewYear, viewMonth);
    } else if (viewMode === "week") {
      const first = weekDays[0];
      const last = weekDays[6];
      if (first.jm === last.jm) {
        return `${toPersianDigits(first.jd)} الی ${toPersianDigits(last.jd)} ${PERSIAN_MONTH_NAMES[first.jm - 1]} ${toPersianDigits(first.jy)}`;
      }
      return `${toPersianDigits(first.jd)} ${PERSIAN_MONTH_NAMES[first.jm - 1]} الی ${toPersianDigits(last.jd)} ${PERSIAN_MONTH_NAMES[last.jm - 1]} ${toPersianDigits(first.jy)}`;
    } else {
      return formatFullJalaliDate(currentDateIso);
    }
  }, [viewMode, viewYear, viewMonth, weekDays, currentDateIso]);

  // Event handlers
  const handleOpenNewEvent = (dateIso?: string, timeStr?: string) => {
    setEventToEdit(null);
    setModalInitialDate(dateIso || currentDateIso);
    setModalInitialTime(timeStr);
    setIsModalOpen(true);
  };

  const handleOpenEditEvent = (evt: any) => {
    setEventToEdit(evt);
    setModalInitialDate(evt.startDate);
    setModalInitialTime(evt.startTime || undefined);
    setIsModalOpen(true);
  };

  const handleSelectDate = (dateIso: string) => {
    setCurrentDateIso(dateIso);
    const j = isoToJalali(dateIso);
    setViewYear(j.jy);
    setViewMonth(j.jm);
    setViewMode("day");
  };

  const handleSaveEvent = async (eventData: any) => {
    if (eventData.id) {
      // Edit
      const res = await fetch(`/api/calendar/events/${eventData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ویرایش رویداد");
    } else {
      // Create
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در ثبت رویداد");
    }

    await fetchEvents();
  };

  const handleDeleteEvent = async (eventId: string) => {
    const res = await fetch(`/api/calendar/events/${eventId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "خطا در حذف رویداد");

    await fetchEvents();
  };

  return (
    <div className="p-3 sm:p-6 md:p-8 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto min-h-screen">
      {/* Header with Navigation and Filters */}
      <CalendarHeader
        viewMode={viewMode}
        onViewModeChange={(mode) => setViewMode(mode)}
        title={headerTitle}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        departments={departments}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={(dept) => setSelectedDepartment(dept)}
        selectedType={selectedType}
        onTypeChange={(type) => setSelectedType(type)}
        myOnly={myOnly}
        onMyOnlyChange={(val) => setMyOnly(val)}
        onNewEvent={() => handleOpenNewEvent()}
      />

      {/* Main Calendar View Area */}
      {isLoading ? (
        <div className="bg-white dark:bg-[#151C28] rounded-3xl border border-gray-200 dark:border-gray-800 p-16 flex flex-col items-center justify-center gap-3 text-sec dark:text-gray-300">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm font-bold">در حال بارگذاری رویدادها و جلسات تقویم...</span>
        </div>
      ) : (
        <div>
          {viewMode === "month" && (
            <MonthView
              days={monthDays}
              events={events}
              onSelectEvent={handleOpenEditEvent}
              onSelectDate={handleSelectDate}
              onNewEventForDate={(dateIso) => handleOpenNewEvent(dateIso)}
            />
          )}

          {viewMode === "week" && (
            <WeekView
              weekDays={weekDays}
              events={events}
              onSelectEvent={handleOpenEditEvent}
              onNewEventForSlot={(dateIso, time) => handleOpenNewEvent(dateIso, time)}
            />
          )}

          {viewMode === "day" && (
            <DayView
              currentDateIso={currentDateIso}
              events={events}
              onSelectEvent={handleOpenEditEvent}
              onNewEvent={(time) => handleOpenNewEvent(currentDateIso, time)}
            />
          )}
        </div>
      )}

      {/* Event Create / Edit / View Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        eventToEdit={eventToEdit}
        initialDateIso={modalInitialDate}
        initialTime={modalInitialTime}
        departments={departments}
        employees={employees}
        currentSession={currentSession}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}
