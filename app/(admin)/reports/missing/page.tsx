"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Send,
  Calendar,
  Search,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  formatToJalali,
  getTehranDateString,
  toPersianDigits,
} from "@/lib/utils";
import PersianDatePicker from "@/components/PersianDatePicker";

export default function MissingReportsPage() {
  const [missingList, setMissingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getTehranDateString());
  const [selectedDept, setSelectedDept] = useState("all");
  const [search, setSearch] = useState("");
  const [sendingReminder, setSendingReminder] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const fetchMissing = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedDate) params.append("date", selectedDate);
      if (selectedDept !== "all") params.append("department", selectedDept);

      const res = await fetch(`/api/reports/missing?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMissingList(data.missingEmployees || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissing();
  }, [selectedDate, selectedDept]);

  const handleSendReminderAll = async () => {
    if (!confirm("آیا می‌خواهید برای تمام کارمندان غایب که به تلگرام متصل هستند یادآوری ارسال کنید؟")) return;

    setSendingReminder(true);
    setNotificationMsg(null);
    try {
      const res = await fetch("/api/cron/reminder", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setNotificationMsg(`پیام یادآوری با موفقیت برای ${toPersianDigits(data.sentCount)} نفر ارسال شد.`);
      } else {
        setNotificationMsg(`خطا: ${data.error}`);
      }
    } catch (err) {
      setNotificationMsg("خطا در ارسال پیام‌ها.");
    } finally {
      setSendingReminder(false);
    }
  };

  const filteredList = missingList.filter((emp) =>
    emp.fullName.toLowerCase().includes(search.toLowerCase())
  );

  const changeDateByDays = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(getTehranDateString(current));
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Page Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-college-light via-white to-female-light/30 p-6 sm:p-7 rounded-3xl border-2 border-college-normal/30 shadow-[3px_3px_0_#F8A41D]">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-college-darker mb-1.5">
            <AlertTriangle className="w-4 h-4 text-college-normal" />
            <span>پایش عدم ثبت گزارش کار</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-sec tracking-tight">لیست غایبان در ثبت گزارش</h1>
          <p className="text-xs sm:text-sm text-ink-normal/70 mt-1 font-medium">
            کارمندان فعالی که در تاریخ {formatToJalali(selectedDate)} چک‌لیست روزانه ثبت نکرده‌اند
          </p>
        </div>

        <button
          onClick={handleSendReminderAll}
          disabled={sendingReminder || missingList.length === 0}
          className="rokad-btn-sec px-5 py-3 text-xs sm:text-sm rounded-xl font-bold self-start md:self-auto"
        >
          <Bell className="w-4 h-4 text-primary" />
          <span>{sendingReminder ? "در حال ارسال..." : "ارسال یادآوری به همه غایبان"}</span>
        </button>
      </div>

      {notificationMsg && (
        <div className="p-4 sm:p-5 rounded-2xl bg-ecosystem-light border border-primary/40 text-xs sm:text-sm font-bold text-ecosystem-darker flex items-center justify-between shadow-sm">
          <span>🌿 {notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)} className="text-xs font-black underline">بستن</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#EAEAEA] shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="جستجوی نام کارمند..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-11 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:border-primary focus:outline-none bg-[#FAFAFA] focus:bg-white font-medium"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-4 top-3.5" />
        </div>

        {/* Date Selector */}
        <div className="w-full md:w-56">
          <PersianDatePicker
            value={selectedDate}
            onChange={(d) => setSelectedDate(d)}
            placeholder="انتخاب تاریخ شمسی..."
          />
        </div>

        {/* Department Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-[#FAFAFA] focus:border-primary focus:outline-none font-bold text-sec"
          >
            <option value="all">همه دپارتمان‌ها</option>
            <option value="پسرانه">پسرانه</option>
            <option value="دخترانه">دخترانه</option>
          </select>
        </div>
      </div>

      {/* Missing Table */}
      <div className="bg-white rounded-3xl border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-[#F8F9FA] border-b border-gray-200 text-ink-normal/70 font-bold">
              <tr>
                <th className="py-4 px-4 sm:px-6">نام کارمند</th>
                <th className="py-4 px-4">دپارتمان</th>
                <th className="py-4 px-4">سمت شغلی</th>
                <th className="py-4 px-4">وضعیت اتصال تلگرام</th>
                <th className="py-4 px-4 sm:px-6 text-center">امکان ارسال پیام</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-gray-400">
                    در حال محاسبه لیست غایبان...
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-sm text-accent-green font-bold">
                    🎉 آفرین! همه کارکنان در این تاریخ گزارش خود را ثبت کرده‌اند.
                  </td>
                </tr>
              ) : (
                filteredList.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-black text-sm sm:text-base text-sec">
                      {emp.fullName}
                    </td>
                    <td className="py-4 px-4 font-bold text-ink-normal/80">
                      {emp.department || "پسرانه"}
                    </td>
                    <td className="py-4 px-4 text-ink-normal/60 font-medium">
                      {emp.position || "همکار"}
                    </td>
                    <td className="py-4 px-4">
                      {emp.isLinked ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ecosystem-light text-ecosystem-darker border border-primary/30 font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                          متصل به ربات
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-female-light text-female-darker border border-female-normal/30 font-bold text-xs">
                          <AlertTriangle className="w-3.5 h-3.5 text-female-normal" />
                          عدم اتصال تلگرام
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      {emp.isLinked ? (
                        <span className="text-xs sm:text-sm font-bold text-accent-green">
                          ✓ دریافت‌کننده یادآوری خودکار
                        </span>
                      ) : (
                        <span className="text-xs sm:text-sm text-female-normal font-bold">
                          نیازمند صدور کد اتصال
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
