"use client";

import React, { useState, useEffect } from "react";
import PersianDatePicker from "@/components/PersianDatePicker";
import { CALENDAR_COLORS } from "@/lib/calendarUtils";
import { toPersianDigits } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  X,
  Calendar,
  Clock,
  Users,
  Video,
  MapPin,
  Trash2,
  Check,
  AlertTriangle,
  Info,
} from "lucide-react";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventToEdit: any | null; // null for create mode
  initialDateIso?: string;
  initialTime?: string;
  departments: { id: string; name: string }[];
  employees: { id: string; fullName: string; department?: string; position?: string }[];
  currentSession: any;
  onSave: (eventData: any) => Promise<void>;
  onDelete?: (eventId: string) => Promise<void>;
}

// Persian hours & minutes for reliable selection
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const val = String(i).padStart(2, "0");
  return { val, label: toPersianDigits(val) };
});

const MINUTE_OPTIONS = [
  { val: "00", label: "۰۰" },
  { val: "15", label: "۱۵" },
  { val: "30", label: "۳۰" },
  { val: "45", label: "۴۵" },
];

export default function EventModal({
  isOpen,
  onClose,
  eventToEdit,
  initialDateIso,
  initialTime,
  departments,
  employees,
  currentSession,
  onSave,
  onDelete,
}: EventModalProps) {
  // Lock background scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow || "unset";
      };
    }
  }, [isOpen]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isEditMode = !!eventToEdit;

  // Determine if current user can edit
  const canEdit = (() => {
    if (!isEditMode) return true;
    if (currentSession?.role === "admin") return true;

    const currentEmpId = currentSession?.employeeId || currentSession?.userId;
    if (eventToEdit.createdBy && currentEmpId && eventToEdit.createdBy === currentEmpId) {
      return true;
    }

    if (
      currentSession?.role === "supervisor" &&
      currentSession?.assignedDepartment &&
      eventToEdit.department === currentSession?.assignedDepartment
    ) {
      return true;
    }

    return false;
  })();

  // Form states
  const [type, setType] = useState<"meeting" | "event">(
    eventToEdit?.type || "meeting"
  );
  const [title, setTitle] = useState(eventToEdit?.title || "");
  const [description, setDescription] = useState(eventToEdit?.description || "");
  const [department, setDepartment] = useState(
    eventToEdit?.department ||
      currentSession?.assignedDepartment ||
      departments[0]?.name ||
      "پسرانه"
  );
  const [color, setColor] = useState(
    eventToEdit?.color ||
      (department === "دخترانه" ? "#E0195B" : department === "پسرانه" ? "#202A5A" : "#59BBAF")
  );
  const [startDate, setStartDate] = useState(
    eventToEdit?.startDate || initialDateIso || new Date().toISOString().split("T")[0]
  );
  const [isAllDay, setIsAllDay] = useState(eventToEdit?.isAllDay || false);

  // Time split into hours & minutes
  const initStartTime = eventToEdit?.startTime || initialTime || "10:00";
  const [startHour, setStartHour] = useState(initStartTime.split(":")[0] || "10");
  const [startMinute, setStartMinute] = useState(initStartTime.split(":")[1] || "00");

  const initEndTime = eventToEdit?.endTime || "11:30";
  const [endHour, setEndHour] = useState(initEndTime.split(":")[0] || "11");
  const [endMinute, setEndMinute] = useState(initEndTime.split(":")[1] || "30");

  const [formatType, setFormatType] = useState<"in_person" | "online">(
    eventToEdit?.location?.startsWith("http") ? "online" : "in_person"
  );
  const [location, setLocation] = useState(eventToEdit?.location || "");
  const [status, setStatus] = useState(eventToEdit?.status || "scheduled");
  const [reminder, setReminder] = useState(eventToEdit?.reminder || "15m");

  // Attendees
  const [selectedAttendeeIds, setSelectedAttendeeIds] = useState<string[]>(() => {
    if (eventToEdit?.attendees) {
      return eventToEdit.attendees.map((a: any) => a.employeeId);
    }
    return [];
  });
  const [attendeeSearch, setAttendeeSearch] = useState("");
  const [isAttendeeDropdownOpen, setIsAttendeeDropdownOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleDepartmentChange = (newDept: string) => {
    setDepartment(newDept);
    if (newDept === "دخترانه") setColor("#E0195B");
    else if (newDept === "پسرانه") setColor("#202A5A");
    else setColor("#59BBAF");
  };

  const toggleAttendee = (empId: string) => {
    if (!canEdit) return;
    setSelectedAttendeeIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.fullName.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
    emp.department?.toLowerCase().includes(attendeeSearch.toLowerCase()) ||
    emp.position?.toLowerCase().includes(attendeeSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!title.trim()) {
      setErrorMessage("لطفاً عنوان جلسه یا رویداد را وارد نمایید.");
      return;
    }
    if (!startDate) {
      setErrorMessage("لطفاً تاریخ برگزاری را مشخص نمایید.");
      return;
    }

    const computedStartTime = `${startHour}:${startMinute}`;
    const computedEndTime = `${endHour}:${endMinute}`;

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await onSave({
        ...(eventToEdit ? { id: eventToEdit.id } : {}),
        title: title.trim(),
        description: description.trim() || null,
        type,
        department,
        color,
        startDate,
        endDate: startDate,
        startTime: isAllDay ? null : computedStartTime,
        endTime: isAllDay ? null : computedEndTime,
        isAllDay,
        location: location.trim() || null,
        status,
        reminder,
        attendeeIds: selectedAttendeeIds,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "خطا در ذخیره اطلاعات.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete || !eventToEdit) return;
    if (!confirm("آیا از حذف این رویداد یا جلسه اطمینان دارید؟")) return;

    setIsDeleting(true);
    try {
      await onDelete(eventToEdit.id);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "خطا در حذف رویداد.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-sec/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#151C28] rounded-3xl border-2 border-primary/30 shadow-[4px_4px_0_#202A5A] dark:shadow-[4px_4px_0_#59BBAF] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-[#1A2333]">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0"
              style={{ backgroundColor: color }}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-sec dark:text-white">
                {isEditMode
                  ? canEdit
                    ? "ویرایش جلسه یا رویداد"
                    : "جزئیات جلسه یا رویداد"
                  : "تعریف جلسه یا رویداد جدید"}
              </h2>
              {eventToEdit?.createdByName && (
                <div className="text-xs text-ink-normal/60 dark:text-gray-400 font-medium mt-0.5">
                  ثبت شده توسط: {eventToEdit.createdByName}
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-ink-normal/40 dark:text-gray-400 hover:text-sec dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Read-only notification if user cannot edit */}
        {!canEdit && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center gap-2.5 text-xs font-bold text-amber-800 dark:text-amber-300">
            <Info className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>
              شما تنها دسترسی مشاهده این مورد را دارید و امکان ویرایش آن برای شما مجاز نیست.
            </span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Row 1: Type Switcher (جلسه کاری vs رویداد سازمانی) */}
          <div>
            <label className="block text-xs font-black text-sec dark:text-gray-200 mb-1.5">
              نوع
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setType("meeting")}
                className={cn(
                  "p-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer",
                  type === "meeting"
                    ? "border-primary bg-ecosystem-light dark:bg-ecosystem-normal/20 text-primary shadow-xs"
                    : "border-gray-200 dark:border-gray-700 text-ink-normal/60 dark:text-gray-400 hover:border-gray-300"
                )}
              >
                <Users className="w-4 h-4" />
                <span>جلسه کاری</span>
              </button>

              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setType("event")}
                className={cn(
                  "p-3 rounded-2xl border-2 font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer",
                  type === "event"
                    ? "border-primary bg-ecosystem-light dark:bg-ecosystem-normal/20 text-primary shadow-xs"
                    : "border-gray-200 dark:border-gray-700 text-ink-normal/60 dark:text-gray-400 hover:border-gray-300"
                )}
              >
                <Calendar className="w-4 h-4" />
                <span>رویداد سازمانی</span>
              </button>
            </div>
          </div>

          {/* Row 2: Title */}
          <div>
            <label className="block text-xs font-black text-sec dark:text-gray-200 mb-1.5">
              عنوان {type === "meeting" ? "جلسه" : "رویداد"} <span className="text-female-normal">*</span>
            </label>
            <input
              type="text"
              required
              disabled={!canEdit}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={
                type === "meeting"
                  ? "مثال: جلسه هماهنگی هفتگی واحد پسرانه..."
                  : "مثال: گردهمایی فصلی تیم‌های روتلو..."
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2536] text-sec dark:text-white text-xs sm:text-sm font-bold focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
            />
          </div>

          {/* Row 3: Department & Color Picker */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-sec dark:text-gray-200 mb-1.5">
                دپارتمان مربوطه <span className="text-female-normal">*</span>
              </label>
              <select
                disabled={!canEdit}
                value={department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2536] text-sec dark:text-white text-xs sm:text-sm font-bold focus:border-primary outline-none transition-all disabled:bg-gray-100 dark:disabled:bg-gray-800 cursor-pointer"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-sec dark:text-gray-200 mb-1.5">
                رنگ شاخص
              </label>
              <div className="flex items-center gap-2 pt-1">
                {CALENDAR_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    disabled={!canEdit}
                    onClick={() => setColor(c.hex)}
                    style={{ backgroundColor: c.hex }}
                    className={cn(
                      "w-7 h-7 rounded-full transition-transform flex items-center justify-center cursor-pointer",
                      color === c.hex
                        ? "scale-110 ring-2 ring-offset-2 ring-primary dark:ring-offset-[#151C28]"
                        : "hover:scale-105 opacity-80"
                    )}
                    title={c.name}
                  >
                    {color === c.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Row 4: Date & Reliable Time Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-sec dark:text-gray-200 mb-1.5">
                تاریخ برگزاری (شمسی) <span className="text-female-normal">*</span>
              </label>
              <PersianDatePicker
                value={startDate}
                disabled={!canEdit}
                onChange={(dateStr) => setStartDate(dateStr)}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-sec dark:text-gray-200">
                  زمان برگزاری
                </label>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-ink-normal/70 dark:text-gray-400 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    disabled={!canEdit}
                    checked={isAllDay}
                    onChange={(e) => setIsAllDay(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-primary cursor-pointer"
                  />
                  <span>تمام روز</span>
                </label>
              </div>

              {!isAllDay ? (
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Start Time Selectors */}
                  <div className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1C2536]">
                    <div className="text-[10px] font-bold text-ink-normal/60 dark:text-gray-400 mb-1">
                      ساعت شروع:
                    </div>
                    <div className="flex items-center gap-1">
                      <select
                        disabled={!canEdit}
                        value={startHour}
                        onChange={(e) => setStartHour(e.target.value)}
                        className="flex-1 py-1 px-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-black text-center text-sec dark:text-white outline-none cursor-pointer"
                      >
                        {HOUR_OPTIONS.map((h) => (
                          <option key={`sh-${h.val}`} value={h.val}>
                            {h.label}
                          </option>
                        ))}
                      </select>
                      <span className="font-bold text-sec dark:text-white">:</span>
                      <select
                        disabled={!canEdit}
                        value={startMinute}
                        onChange={(e) => setStartMinute(e.target.value)}
                        className="flex-1 py-1 px-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-black text-center text-sec dark:text-white outline-none cursor-pointer"
                      >
                        {MINUTE_OPTIONS.map((m) => (
                          <option key={`sm-${m.val}`} value={m.val}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* End Time Selectors */}
                  <div className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1C2536]">
                    <div className="text-[10px] font-bold text-ink-normal/60 dark:text-gray-400 mb-1">
                      ساعت پایان:
                    </div>
                    <div className="flex items-center gap-1">
                      <select
                        disabled={!canEdit}
                        value={endHour}
                        onChange={(e) => setEndHour(e.target.value)}
                        className="flex-1 py-1 px-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-black text-center text-sec dark:text-white outline-none cursor-pointer"
                      >
                        {HOUR_OPTIONS.map((h) => (
                          <option key={`eh-${h.val}`} value={h.val}>
                            {h.label}
                          </option>
                        ))}
                      </select>
                      <span className="font-bold text-sec dark:text-white">:</span>
                      <select
                        disabled={!canEdit}
                        value={endMinute}
                        onChange={(e) => setEndMinute(e.target.value)}
                        className="flex-1 py-1 px-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-black text-center text-sec dark:text-white outline-none cursor-pointer"
                      >
                        {MINUTE_OPTIONS.map((m) => (
                          <option key={`em-${m.val}`} value={m.val}>
                            {m.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-3 px-3 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-ink-normal/50 dark:text-gray-400 text-center">
                  رویداد در کل ساعات روز برنامه‌ریزی شده است
                </div>
              )}
            </div>
          </div>

          {/* Row 5: Participants / Attendees */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black text-sec dark:text-gray-200 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-primary" />
                <span>حاضرین و مدعوین ({toPersianDigits(selectedAttendeeIds.length)} نفر)</span>
              </label>

              {canEdit && (
                <button
                  type="button"
                  onClick={() => setIsAttendeeDropdownOpen(!isAttendeeDropdownOpen)}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  {isAttendeeDropdownOpen ? "بستن فهرست" : "+ انتخاب از بین همکاران"}
                </button>
              )}
            </div>

            {/* Selected Attendees Chips */}
            <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-[#1C2536]/60 min-h-[44px] items-center">
              {selectedAttendeeIds.length === 0 ? (
                <span className="text-xs text-ink-normal/40 dark:text-gray-500 font-medium">
                  فردی تخصیص داده نشده است (از گزینه بالا برای افزودن استفاده کنید)
                </span>
              ) : (
                selectedAttendeeIds.map((empId) => {
                  const emp = employees.find((e) => e.id === empId);
                  return (
                    <div
                      key={empId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-sec dark:text-gray-200 shadow-2xs"
                    >
                      <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-black">
                        {emp?.fullName ? emp.fullName[0] : "ع"}
                      </div>
                      <span>{emp?.fullName || "همکار"}</span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => toggleAttendee(empId)}
                          className="hover:text-female-normal text-gray-400 transition-colors p-0.5 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Attendee Selection Dropdown list */}
            {isAttendeeDropdownOpen && canEdit && (
              <div className="mt-2 p-3 rounded-2xl border-2 border-primary/20 bg-white dark:bg-[#1A2333] shadow-lg space-y-2 animate-in fade-in zoom-in-95 duration-150">
                <input
                  type="text"
                  placeholder="جستجوی نام همکار، دپارتمان یا سمت..."
                  value={attendeeSearch}
                  onChange={(e) => setAttendeeSearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-sec dark:text-white font-bold outline-none"
                />

                <div className="max-h-44 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800">
                  {filteredEmployees.map((emp) => {
                    const isSelected = selectedAttendeeIds.includes(emp.id);
                    return (
                      <div
                        key={emp.id}
                        onClick={() => toggleAttendee(emp.id)}
                        className={cn(
                          "py-2 px-2.5 rounded-xl flex items-center justify-between cursor-pointer text-xs font-bold transition-colors",
                          isSelected
                            ? "bg-ecosystem-light dark:bg-ecosystem-normal/20 text-primary"
                            : "hover:bg-gray-50 dark:hover:bg-gray-800 text-sec dark:text-gray-300"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-[10px]">
                            {emp.fullName[0]}
                          </div>
                          <div>
                            <div>{emp.fullName}</div>
                            <div className="text-[10px] text-ink-normal/50 dark:text-gray-400 font-normal">
                              {emp.department ? `${emp.department} • ` : ""}{emp.position || "کارشناس"}
                            </div>
                          </div>
                        </div>

                        <div
                          className={cn(
                            "w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                            isSelected
                              ? "bg-primary border-primary text-white"
                              : "border-gray-300 dark:border-gray-600"
                          )}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Row 6: Format & Location / Link */}
          <div>
            <label className="block text-xs font-black text-sec dark:text-gray-200 mb-1.5">
              محل برگزاری یا لینک جلسه
            </label>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setFormatType("in_person")}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer",
                  formatType === "in_person"
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "border-gray-200 dark:border-gray-700 text-ink-normal/60 dark:text-gray-400 hover:bg-gray-50"
                )}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>حضوری</span>
              </button>

              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setFormatType("online")}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer",
                  formatType === "online"
                    ? "bg-primary text-white border-primary shadow-xs"
                    : "border-gray-200 dark:border-gray-700 text-ink-normal/60 dark:text-gray-400 hover:bg-gray-50"
                )}
              >
                <Video className="w-3.5 h-3.5" />
                <span>آنلاین</span>
              </button>
            </div>

            <input
              type="text"
              disabled={!canEdit}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={
                formatType === "online"
                  ? "لینک جلسه آنلاین (مثلاً گوگل میت، قرار، اسکایپ...)"
                  : "اتاق جلسات، سالن کنفرانس یا آدرس..."
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2536] text-sec dark:text-white text-xs sm:text-sm font-bold focus:border-primary outline-none transition-all disabled:bg-gray-100 dark:disabled:bg-gray-800"
            />
          </div>

          {/* Row 7: Description / Agenda */}
          <div>
            <label className="block text-xs font-black text-sec dark:text-gray-200 mb-1.5">
              دستور جلسه و توضیحات تکمیلی
            </label>
            <textarea
              rows={3}
              disabled={!canEdit}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="سرفصل‌ها، پیش‌نیازها و نکات مد نظر..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2536] text-sec dark:text-white text-xs font-medium focus:border-primary outline-none transition-all disabled:bg-gray-100 dark:disabled:bg-gray-800 resize-none"
            />
          </div>

          {/* Row 8: Status & Reminder (بدون کلمات انگلیسی) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-sec dark:text-gray-200 mb-1.5">
                وضعیت برگزاری
              </label>
              <select
                disabled={!canEdit}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2536] text-sec dark:text-white text-xs font-bold focus:border-primary outline-none cursor-pointer"
              >
                <option value="scheduled">برنامه‌ریزی شده</option>
                <option value="in_progress">در حال برگزاری</option>
                <option value="completed">خاتمه یافته</option>
                <option value="cancelled">لغو شده</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-sec dark:text-gray-200 mb-1.5">
                یادآوری قبل از موعد
              </label>
              <select
                disabled={!canEdit}
                value={reminder}
                onChange={(e) => setReminder(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2536] text-sec dark:text-white text-xs font-bold focus:border-primary outline-none cursor-pointer"
              >
                <option value="none">بدون یادآوری</option>
                <option value="15m">۱۵ دقیقه قبل</option>
                <option value="30m">۳۰ دقیقه قبل</option>
                <option value="1h">۱ ساعت قبل</option>
                <option value="1d">۱ روز قبل</option>
              </select>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-[#1A2333] flex items-center justify-between gap-3">
          <div>
            {isEditMode && canEdit && onDelete && (
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 font-bold text-xs transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? "در حال حذف..." : "حذف"}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sec dark:text-gray-300 hover:bg-gray-50 font-bold text-xs transition-colors cursor-pointer"
            >
              {canEdit ? "انصراف" : "بستن"}
            </button>

            {canEdit && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-ecosystem-normal hover:bg-ecosystem-darker text-white font-bold text-xs shadow-[2px_2px_0_#202A5A] dark:shadow-[2px_2px_0_#59BBAF] transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>
                  {isSubmitting
                    ? "در حال ذخیره..."
                    : isEditMode
                    ? "ذخیره تغییرات"
                    : "ثبت"}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
