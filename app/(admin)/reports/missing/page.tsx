"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  ChevronLeft,
  Send,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import {
  formatToJalali,
  getTehranDateString,
  toPersianDigits,
} from "@/lib/utils";

export default function MissingReportsPage() {
  const [missing, setMissing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<string>(getTehranDateString());
  const [selectedDept, setSelectedDept] = useState("all");
  const [search, setSearch] = useState("");
  const [reminding, setReminding] = useState(false);
  const [reminderResult, setReminderResult] = useState<string | null>(null);

  const fetchMissing = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("date", currentDate);
      if (selectedDept !== "all") params.append("department", selectedDept);

      const res = await fetch(`/api/reports/missing?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMissing(data.missingEmployees || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissing();
  }, [currentDate, selectedDept]);

  const handleDateChange = (days: number) => {
    const parts = currentDate.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setCurrentDate(`${y}-${m}-${day}`);
  };

  const handleSendReminder = async () => {
    setReminding(true);
    setReminderResult(null);
    try {
      const res = await fetch("/api/cron/reminder", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setReminderResult(`یادآوری با موفقیت برای ${data.sentCount} نفر از کارمندان متصل به تلگرام ارسال گردید.`);
      } else {
        setReminderResult(`خطا: ${data.error}`);
      }
    } catch (err) {
      setReminderResult("خطا در ارسال یادآوری");
    } finally {
      setReminding(false);
    }
  };

  const departments = Array.from(new Set(missing.map((m) => m.department).filter(Boolean)));

  const filtered = search
    ? missing.filter((m) => m.fullName.toLowerCase().includes(search.toLowerCase()))
    : missing;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Date Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-female-normal mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span>پایش عدم ارسال گزارش</span>
          </div>
          <h1 className="text-2xl font-black text-sec">لیست غایبان در ثبت چک‌لیست</h1>
          <p className="text-xs text-ink-normal/60 mt-1">
            مشاهده کارکنانی که برای تاریخ انتخابی گزارش کاری ارسال نکرده‌اند
          </p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-[2px_2px_0_#202A5A]">
          <button
            onClick={() => handleDateChange(-1)}
            title="روز قبل"
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-college-light rounded-xl font-bold text-xs text-college-darker border border-college-normal/30">
            <Calendar className="w-3.5 h-3.5 text-college-normal" />
            <span>{formatToJalali(currentDate, { showMonthName: true, includeDayName: true })}</span>
          </div>

          <button
            onClick={() => handleDateChange(1)}
            title="روز بعد"
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setCurrentDate(getTehranDateString())}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-gray-100 hover:bg-gray-200 text-sec transition-colors"
          >
            امروز
          </button>
        </div>
      </div>

      {/* Action Banner */}
      <div className="p-5 bg-gradient-to-r from-college-light via-white to-female-light/30 rounded-2xl border border-college-normal/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-college-normal text-white flex items-center justify-center font-bold text-base">
            {toPersianDigits(missing.length)}
          </div>
          <div>
            <div className="text-xs font-bold text-sec">
              تعداد {toPersianDigits(missing.length)} نفر هنوز گزارش این تاریخ را ارسال نکرده‌اند.
            </div>
            <div className="text-[11px] text-ink-normal/60 mt-0.5">
              می‌توانید پیام یادآوری تلگرام را به صورت گروهی برای آن‌ها ارسال کنید.
            </div>
          </div>
        </div>

        <button
          onClick={handleSendReminder}
          disabled={reminding || missing.length === 0}
          className="rokad-btn-sec px-4 py-2.5 text-xs rounded-xl shadow-[2.5px_2.5px_0_#0B0F1F]"
        >
          <Send className="w-4 h-4 text-college-normal" />
          <span>{reminding ? "در حال ارسال پیام..." : "ارسال یادآوری فوری به تلگرام"}</span>
        </button>
      </div>

      {reminderResult && (
        <div className="p-4 rounded-xl bg-ecosystem-light border border-primary/30 text-xs font-bold text-ecosystem-darker flex items-center justify-between">
          <span>{reminderResult}</span>
          <button onClick={() => setReminderResult(null)} className="underline">بستن</button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAEAEA] shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="جستجوی نام کارمند..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-10 py-2 rounded-xl border border-gray-200 text-xs focus:border-primary focus:outline-none bg-[#FAFAFA] focus:bg-white"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-2.5" />
        </div>

        <div className="w-full md:w-48">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-[#FAFAFA] focus:border-primary focus:outline-none font-bold text-sec"
          >
            <option value="all">همه دپارتمان‌ها</option>
            <option value="پسرانه">پسرانه</option>
            <option value="دخترانه">دخترانه</option>
          </select>
        </div>
      </div>

      {/* Missing Employees Table */}
      <div className="bg-white rounded-2xl border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#F8F9FA] border-b border-gray-200 text-ink-normal/70 font-bold">
              <tr>
                <th className="py-3.5 px-4">نام و نام خانوادگی</th>
                <th className="py-3.5 px-4">دپارتمان</th>
                <th className="py-3.5 px-4">سمت شغلی</th>
                <th className="py-3.5 px-4">وضعیت تلگرام</th>
                <th className="py-3.5 px-4">وضعیت ارسال</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-400">
                    در حال بارگذاری لیست غایبان...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12">
                    <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-2" />
                    <div className="text-sm font-bold text-sec">عالی! همه کارکنان گزارش خود را ارسال کرده‌اند.</div>
                    <div className="text-xs text-ink-normal/50 mt-1">هیچ غیبتی برای این تاریخ ثبت نشده است.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-sec">{emp.fullName}</td>
                    <td className="py-3.5 px-4 text-ink-normal/70">{emp.department || "عمومی"}</td>
                    <td className="py-3.5 px-4 text-ink-normal/60">{emp.position || "همکار"}</td>
                    <td className="py-3.5 px-4">
                      {emp.isLinked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-ecosystem-light text-ecosystem-darker border border-primary/20 text-[11px] font-bold">
                          <CheckCircle2 className="w-3 h-3 text-primary" />
                          متصل
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-college-light text-college-darker border border-college-normal/30 text-[11px] font-bold">
                          <AlertCircle className="w-3 h-3 text-college-normal" />
                          غیرمتصل (کد: {emp.linkCode || "ندارد"})
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-female-light text-female-darker border border-female-normal/20">
                        عدم ثبت گزارش
                      </span>
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
