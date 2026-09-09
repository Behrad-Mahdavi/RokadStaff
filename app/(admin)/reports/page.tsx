"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  FileCheck2,
  Search,
  Calendar,
  Clock,
  Eye,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Printer,
} from "lucide-react";
import Modal from "@/components/Modal";
import {
  formatToJalali,
  formatTehranTime,
  getTehranDateString,
  toPersianDigits,
} from "@/lib/utils";
import PersianDatePicker from "@/components/PersianDatePicker";

function ReportsContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "missing" ? "missing" : "submitted";

  const [activeTab, setActiveTab] = useState<"submitted" | "missing">(initialTab);

  // Shared filters
  const [selectedDate, setSelectedDate] = useState(getTehranDateString());
  const [selectedDept, setSelectedDept] = useState("all");
  const [search, setSearch] = useState("");

  // Submitted reports state
  const [reports, setReports] = useState<any[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Missing employees state
  const [missingList, setMissingList] = useState<any[]>([]);
  const [missingLoading, setMissingLoading] = useState(true);
  const [sendingReminder, setSendingReminder] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const handleExportPDF = () => {
    window.print();
  };

  // Fetch submitted reports
  const fetchReports = async () => {
    try {
      setReportsLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedDept !== "all") params.append("department", selectedDept);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedDate) params.append("date", selectedDate);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setReportsLoading(false);
    }
  };

  // Fetch missing employees
  const fetchMissing = async () => {
    try {
      setMissingLoading(true);
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
      setMissingLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
    fetchMissing();
  }, [selectedDate, selectedDept]);

  useEffect(() => {
    fetchReports();
  }, [search, selectedStatus]);

  const changeDateByDays = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(getTehranDateString(current));
  };

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

  const filteredMissingList = missingList.filter((emp) =>
    emp.fullName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* ------------------------------------------------------------- */}
      {/* 1. INTERACTIVE SCREEN UI (Hidden when printing/saving to PDF) */}
      {/* ------------------------------------------------------------- */}
      <div className="screen-only space-y-6 sm:space-y-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-sec dark:text-white tracking-tight">
            گزارش‌های روزانه
          </h1>
          <p className="text-xs sm:text-sm text-ink-normal/70 dark:text-gray-300 mt-1 font-medium">
            مشاهده گزارش‌های روزانه کارکنان و پیگیری هوشمند غایبان
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2.5 rounded-2xl bg-primary text-white text-xs font-black flex items-center gap-1.5 shadow-sm hover:opacity-95 transition"
          >
            <Printer className="w-4 h-4" />
            <span>دریافت PDF</span>
          </button>

          {/* Date Navigator Quick Bar */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#151C28] p-1.5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <button
              onClick={() => changeDateByDays(1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#1C2536] rounded-xl text-sec dark:text-gray-200 transition-colors"
              title="روز بعد"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 px-3 py-1 font-bold text-xs sm:text-sm text-sec dark:text-white">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formatToJalali(selectedDate, { showMonthName: true, includeDayName: true })}</span>
            </div>
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-[#1C2536] rounded-xl text-sec dark:text-gray-200 transition-colors"
              title="روز قبل"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedDate(getTehranDateString())}
              className="px-3 py-1.5 bg-ecosystem-light dark:bg-ecosystem-darker/50 text-ecosystem-darker dark:text-ecosystem-light rounded-xl text-xs sm:text-sm font-bold border border-primary/30 hover:bg-ecosystem-light-hover transition-colors"
            >
              امروز
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-2">
        <button
          onClick={() => setActiveTab("submitted")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
            activeTab === "submitted"
              ? "bg-primary text-white shadow-sm"
              : "text-ink-normal/70 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>گزارش‌های ثبت‌شده</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            activeTab === "submitted" ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-gray-700 text-sec dark:text-gray-300"
          }`}>
            {toPersianDigits(reports.length)}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("missing")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all ${
            activeTab === "missing"
              ? "bg-college-normal text-white shadow-sm"
              : "text-ink-normal/70 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>لیست غایبان و پیگیری</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            activeTab === "missing" ? "bg-white/20 text-white" : "bg-gray-200 dark:bg-gray-700 text-sec dark:text-gray-300"
          }`}>
            {toPersianDigits(missingList.length)}
          </span>
        </button>
      </div>

      {/* Shared Filter Bar */}
      <div className="bg-white dark:bg-[#151C28] p-4 sm:p-5 rounded-3xl border border-[#EAEAEA] dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder={activeTab === "submitted" ? "جستجوی نام همکار یا متن گزارش..." : "جستجوی نام همکار غایب..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs sm:text-sm focus:border-primary focus:outline-none bg-[#FAFAFA] dark:bg-[#1C2536] dark:text-white focus:bg-white dark:focus:bg-[#1C2536] font-medium"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-3" />
        </div>

        {/* Date Selector Input */}
        <div className="w-full md:w-56">
          <PersianDatePicker
            value={selectedDate}
            onChange={(d) => setSelectedDate(d)}
            placeholder="انتخاب تاریخ شمسی..."
          />
        </div>

        {/* Department Filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs sm:text-sm bg-[#FAFAFA] dark:bg-[#1C2536] dark:text-white focus:border-primary focus:outline-none font-bold text-sec dark:text-white"
          >
            <option value="all">همه دپارتمان‌ها</option>
            <option value="پسرانه">پسرانه</option>
            <option value="دخترانه">دخترانه</option>
          </select>
        </div>

        {/* Status Filter (Only for submitted reports) */}
        {activeTab === "submitted" && (
          <div className="w-full md:w-40">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs sm:text-sm bg-[#FAFAFA] dark:bg-[#1C2536] dark:text-white focus:border-primary focus:outline-none font-bold text-sec dark:text-white"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="on_time">به‌موقع</option>
              <option value="late">با تأخیر</option>
            </select>
          </div>
        )}

        {/* Action Button for Missing Tab */}
        {activeTab === "missing" && (
          <button
            onClick={handleSendReminderAll}
            disabled={sendingReminder || missingList.length === 0}
            className="w-full md:w-auto rokad-btn-sec px-4 py-2.5 text-xs sm:text-sm rounded-xl font-bold flex items-center justify-center gap-2 shrink-0 dark:bg-college-dark dark:border-college-normal"
          >
            <Bell className="w-4 h-4 text-primary" />
            <span>{sendingReminder ? "در حال ارسال..." : "ارسال یادآوری به غایبان"}</span>
          </button>
        )}
      </div>

      {notificationMsg && (
        <div className="p-4 rounded-2xl bg-ecosystem-light dark:bg-ecosystem-darker/40 border border-primary/40 text-xs sm:text-sm font-bold text-ecosystem-darker dark:text-ecosystem-light flex items-center justify-between shadow-sm">
          <span>🌿 {notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)} className="text-xs font-black underline">بستن</button>
        </div>
      )}

      {/* TAB 1: Submitted Reports Table */}
      {activeTab === "submitted" && (
        <div className="bg-white dark:bg-[#151C28] rounded-3xl border border-[#EAEAEA] dark:border-gray-800 shadow-[3px_3px_0_#202A5A] dark:shadow-[3px_3px_0_#59BBAF] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm min-w-[650px]">
              <thead className="bg-[#F8F9FA] dark:bg-[#1C2536] border-b border-gray-200 dark:border-gray-800 text-ink-normal/70 dark:text-gray-300 font-bold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">همکار</th>
                  <th className="py-3.5 px-4">دپارتمان</th>
                  <th className="py-3.5 px-4">ساعت ارسال</th>
                  <th className="py-3.5 px-4">وضعیت ارسال</th>
                  <th className="py-3.5 px-4">پیش‌نمایش گزارش</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">مشاهده کامل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {reportsLoading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-gray-400">
                      در حال بارگذاری گزارش‌ها...
                    </td>
                  </tr>
                ) : reports.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-gray-400">
                      گزارشی در این تاریخ با مشخصات انتخاب‌شده ثبت نشده است.
                    </td>
                  </tr>
                ) : (
                  reports.map((report) => {
                    const cleanText = (report.rawText || "").replace(/^\/report\s*/i, "").trim();
                    return (
                      <tr key={report.id} className="hover:bg-gray-50/70 dark:hover:bg-[#1C2536]/50 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-bold text-sec dark:text-white">
                          <div className="font-black text-sm text-sec dark:text-white">{report.employeeFullName}</div>
                          <div className="text-xs text-ink-normal/50 dark:text-gray-400 mt-0.5">{report.employeePosition || "همکار"}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-ink-normal/80 dark:text-gray-300">
                          {report.employeeDepartment || "پسرانه"}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-sec dark:text-gray-200 text-xs sm:text-sm">
                          {formatTehranTime(report.submittedAt)}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs border ${
                              report.status === "on_time"
                                ? "bg-ecosystem-light dark:bg-ecosystem-darker/40 text-ecosystem-darker dark:text-ecosystem-light border-primary/30"
                                : "bg-female-light dark:bg-female-darker/40 text-female-darker dark:text-female-light border-female-normal/30"
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            {report.status === "on_time" ? "به‌موقع" : "با تأخیر"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-ink-normal/70 dark:text-gray-400 font-medium">
                          {cleanText}
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-center">
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setIsDetailModalOpen(true);
                            }}
                            className="rokad-btn-outline px-3.5 py-1.5 text-xs sm:text-sm rounded-xl font-bold dark:bg-[#1C2536] dark:border-gray-700 dark:text-gray-200"
                          >
                            <Eye className="w-4 h-4 text-primary" />
                            <span>مشاهده متن</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Missing Employees Table */}
      {activeTab === "missing" && (
        <div className="bg-white dark:bg-[#151C28] rounded-3xl border border-[#EAEAEA] dark:border-gray-800 shadow-[3px_3px_0_#202A5A] dark:shadow-[3px_3px_0_#59BBAF] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm">
              <thead className="bg-[#F8F9FA] dark:bg-[#1C2536] border-b border-gray-200 dark:border-gray-800 text-ink-normal/70 dark:text-gray-300 font-bold">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">نام همکار</th>
                  <th className="py-3.5 px-4">دپارتمان</th>
                  <th className="py-3.5 px-4">سمت شغلی</th>
                  <th className="py-3.5 px-4">وضعیت اتصال تلگرام</th>
                  <th className="py-3.5 px-4 sm:px-6 text-center">امکان ارسال یادآوری</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {missingLoading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-sm text-gray-400">
                      در حال محاسبه لیست غایبان...
                    </td>
                  </tr>
                ) : filteredMissingList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-sm text-accent-green font-bold">
                      🎉 تبریک! همه کارکنان در این تاریخ گزارش خود را ثبت کرده‌اند.
                    </td>
                  </tr>
                ) : (
                  filteredMissingList.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50/70 dark:hover:bg-[#1C2536]/50 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6 font-black text-sm text-sec dark:text-white">
                        {emp.fullName}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-ink-normal/80 dark:text-gray-300">
                        {emp.department || "پسرانه"}
                      </td>
                      <td className="py-3.5 px-4 text-ink-normal/60 dark:text-gray-400 font-medium">
                        {emp.position || "همکار"}
                      </td>
                      <td className="py-3.5 px-4">
                        {emp.isLinked ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ecosystem-light dark:bg-ecosystem-darker/40 text-ecosystem-darker dark:text-ecosystem-light border border-primary/30 font-bold text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                            متصل به ربات
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-female-light dark:bg-female-darker/40 text-female-darker dark:text-female-light border border-female-normal/30 font-bold text-xs">
                            <AlertTriangle className="w-3.5 h-3.5 text-female-normal" />
                            عدم اتصال تلگرام
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 sm:px-6 text-center">
                        {emp.isLinked ? (
                          <span className="text-xs sm:text-sm font-bold text-accent-green">
                            ✓ دریافت‌کننده یادآوری
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
      )}

      {/* Modal: View Report Full Details */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`متن گزارش کار: ${selectedReport?.employeeFullName || ""}`}
        maxWidth="lg"
      >
        {selectedReport && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#1C2536] border border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-ink-normal/60 dark:text-gray-400">تاریخ گزارش: </span>
                <span className="font-bold text-sec dark:text-white">{selectedReport.reportDateJalali}</span>
              </div>
              <div>
                <span className="text-ink-normal/60 dark:text-gray-400">ساعت ثبت: </span>
                <span className="font-bold text-sec dark:text-white font-mono">{selectedReport.submittedAtTime}</span>
              </div>
              <div>
                <span
                  className={`font-black px-2.5 py-0.5 rounded-full text-xs ${
                    selectedReport.status === "on_time"
                      ? "bg-ecosystem-light dark:bg-ecosystem-darker/40 text-ecosystem-darker dark:text-ecosystem-light"
                      : "bg-female-light dark:bg-female-darker/40 text-female-darker dark:text-female-light"
                  }`}
                >
                  {selectedReport.status === "on_time" ? "به‌موقع" : "با تأخیر"}
                </span>
              </div>
            </div>

            {/* Report Content Box */}
            <div>
              <h4 className="text-sm font-black text-sec dark:text-white mb-2">متن ارسال شده توسط همکار:</h4>
              <div className="p-5 bg-gray-50 dark:bg-[#111622] rounded-2xl border border-gray-200 dark:border-gray-800 text-xs sm:text-sm font-medium text-ink-darker dark:text-gray-200 leading-loose whitespace-pre-wrap max-h-96 overflow-y-auto">
                {(selectedReport.rawText || "").replace(/^\/report\s*/i, "").trim()}
              </div>
            </div>
          </div>
        )}
      </Modal>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. STATE-OF-THE-ART EXECUTIVE DAILY MANAGEMENT REPORT (PRINT ONLY) */}
      {/* ------------------------------------------------------------- */}
      <div className="print-only font-vazirmatn text-slate-900 space-y-5" dir="rtl">
        {/* Double-border Official Letterhead */}
        <div className="border-b-[3px] border-slate-900 pb-3">
          <div className="flex items-start justify-between">
            {/* Logo & Org Title */}
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl border-2 border-slate-900 flex items-center justify-center p-1 bg-white shrink-0">
                <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-600 tracking-wider">بنام خدا</div>
                <h1 className="text-lg font-black text-slate-950 mt-0.5">استودیو خلاق روتلو • مدیریت عوامل سازمانی</h1>
                <p className="text-xs text-slate-700 font-bold mt-0.5">صورتجلسه و گزارش رسمی عملکرد روزانه پرسنل</p>
              </div>
            </div>

            {/* Official Metadata Document Stamp */}
            <div className="border border-slate-300 bg-slate-50/80 rounded-xl p-2.5 text-[10.5px] space-y-1 min-w-[210px]">
              <div className="flex justify-between">
                <span className="font-bold text-slate-600">شماره ثبت سند:</span>
                <span className="font-mono font-bold text-slate-900">ROT-RPT-{toPersianDigits(selectedDate.replace(/-/g, "").slice(2))}-{toPersianDigits(reports.length)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-600">تاریخ گزارش:</span>
                <span className="font-bold text-slate-900">{formatToJalali(selectedDate, { showMonthName: true, includeDayName: true })}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-600">زمان صدور:</span>
                <span className="font-mono text-slate-800">{formatToJalali(new Date())}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="font-bold text-slate-600">طبقه‌بندی:</span>
                <span className="font-black text-amber-800 bg-amber-100/80 px-1.5 py-0.2 rounded text-[9.5px]">سازمانی / محرمانه</span>
              </div>
            </div>
          </div>
          {/* Teal Accent Line */}
          <div className="h-1 bg-gradient-to-l from-teal-600 via-slate-800 to-teal-700 rounded-full mt-3" />
        </div>

        {/* Executive KPI Metric Tiles */}
        <div className="avoid-break">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              <span>۱. خلاصه شاخص‌های عملکرد روزانه (Daily KPIs Dashboard)</span>
            </h2>
            <span className="text-[10px] text-slate-500 font-medium">پایش لحظه‌ای بر اساس داده‌های ثبت‌شده</span>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {/* Tile 1: Total Personnel */}
            <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 border-t-4 border-t-slate-700 text-center">
              <div className="text-[11px] font-bold text-slate-600">کل عوامل فعال</div>
              <div className="text-xl font-black text-slate-900 my-1 font-mono">
                {toPersianDigits(reports.length + missingList.length)} <span className="text-xs font-normal">نفر</span>
              </div>
              <div className="text-[10px] text-slate-500">مجموع ثبت‌شده و بدون ثبت</div>
            </div>

            {/* Tile 2: Submitted */}
            <div className="border border-emerald-300 rounded-xl p-3 bg-emerald-50/50 border-t-4 border-t-emerald-600 text-center">
              <div className="text-[11px] font-bold text-emerald-800">گزارش‌های ثبت‌شده</div>
              <div className="text-xl font-black text-emerald-700 my-1 font-mono">
                {toPersianDigits(reports.length)} <span className="text-xs font-normal">نفر</span>
              </div>
              <div className="text-[10px] text-emerald-600 font-bold">
                ٪{toPersianDigits(
                  reports.length + missingList.length > 0
                    ? Math.round((reports.length / (reports.length + missingList.length)) * 100)
                    : 0
                )} مشارکت کل
              </div>
            </div>

            {/* Tile 3: Missing */}
            <div className="border border-rose-300 rounded-xl p-3 bg-rose-50/50 border-t-4 border-t-rose-600 text-center">
              <div className="text-[11px] font-bold text-rose-800">موارد عدم ثبت (غیبت)</div>
              <div className="text-xl font-black text-rose-700 my-1 font-mono">
                {toPersianDigits(missingList.length)} <span className="text-xs font-normal">نفر</span>
              </div>
              <div className="text-[10px] text-rose-600 font-bold">
                {missingList.length === 0 ? "بدون مورد عدم ثبت" : "نیازمند پیگیری انضباطی"}
              </div>
            </div>

            {/* Tile 4: On-time rate */}
            <div className="border border-blue-300 rounded-xl p-3 bg-blue-50/50 border-t-4 border-t-blue-600 text-center">
              <div className="text-[11px] font-bold text-blue-800">نرخ ثبت به‌موقع</div>
              <div className="text-xl font-black text-blue-700 my-1 font-mono">
                ٪{toPersianDigits(
                  reports.length > 0
                    ? Math.round((reports.filter((r) => r.status === "on_time").length / reports.length) * 100)
                    : 100
                )}
              </div>
              <div className="text-[10px] text-blue-600">
                {toPersianDigits(reports.filter((r) => r.status === "on_time").length)} گزارش بدون تأخیر
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Submitted Reports Table */}
        <div className="avoid-break">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              <span>۲. فهرست تفصیلی فعالیت‌ها و گزارش‌های ثبت‌شده</span>
            </h2>
            <span className="text-[10.5px] text-slate-500 font-bold">
              تعداد: {toPersianDigits(reports.length)} فقره گزارش
            </span>
          </div>

          {reports.length === 0 ? (
            <div className="p-4 border-2 border-dashed border-slate-300 text-xs text-slate-500 text-center rounded-xl bg-slate-50">
              هیچ گزارش کاری برای این تاریخ ثبت نشده است.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-300">
              <table className="executive-table">
                <thead>
                  <tr>
                    <th className="w-9 text-center">ردیف</th>
                    <th className="w-32">نام همکار</th>
                    <th className="w-24 text-center">دپارتمان</th>
                    <th className="w-20 text-center">زمان ثبت</th>
                    <th className="w-24 text-center">وضعیت تحویل</th>
                    <th>شرح فعالیت‌ها، دستاوردها و اقلام تحویلی</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((rep: any, idx: number) => {
                    const isOnTime = rep.status === "on_time";
                    return (
                      <tr key={rep.id}>
                        <td className="text-center font-bold text-slate-600">{toPersianDigits(idx + 1)}</td>
                        <td className="font-bold text-slate-900">{rep.employeeName}</td>
                        <td className="text-center text-slate-700 font-medium">{rep.department || "پسرانه"}</td>
                        <td className="text-center font-mono text-slate-700 text-[10px]">{rep.submittedAtTime}</td>
                        <td className="text-center">
                          <span
                            className={`print-badge ${
                              isOnTime
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : "bg-amber-50 text-amber-800 border-amber-300"
                            }`}
                          >
                            {isOnTime ? "به‌موقع" : "با تأخیر"}
                          </span>
                        </td>
                        <td className="leading-relaxed text-[10px] text-slate-800">
                          {(rep.rawText || "").replace(/^\/report\s*/i, "").trim()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 3: Missing Employees Table (If any) */}
        {missingList.length > 0 && (
          <div className="avoid-break">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span>۳. فهرست همکاران بدون گزارش کار (غایبان سامانه در این روز)</span>
              </h2>
              <span className="text-[10.5px] text-rose-700 font-bold">
                تعداد: {toPersianDigits(missingList.length)} نفر
              </span>
            </div>

            <div className="overflow-hidden rounded-xl border border-rose-200">
              <table className="executive-table">
                <thead>
                  <tr className="bg-rose-900">
                    <th className="w-9 text-center bg-rose-900 text-white">ردیف</th>
                    <th className="bg-rose-900 text-white">نام و نام خانوادگی</th>
                    <th className="w-28 text-center bg-rose-900 text-white">دپارتمان</th>
                    <th className="w-32 bg-rose-900 text-white">سمت سازمانی</th>
                    <th className="w-24 text-center bg-rose-900 text-white">اتصال به تلگرام</th>
                    <th className="bg-rose-900 text-white">علت و ملاحظات سرپرست</th>
                  </tr>
                </thead>
                <tbody>
                  {missingList.map((emp: any, idx: number) => (
                    <tr key={emp.id}>
                      <td className="text-center font-bold text-slate-600">{toPersianDigits(idx + 1)}</td>
                      <td className="font-bold text-slate-900">{emp.fullName}</td>
                      <td className="text-center text-slate-700">{emp.department || "پسرانه"}</td>
                      <td className="text-slate-700">{emp.position || "عضو تیم"}</td>
                      <td className="text-center">
                        <span
                          className={`print-badge ${
                            emp.isLinked
                              ? "bg-slate-100 text-slate-700 border-slate-300"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {emp.isLinked ? "متصل" : "عدم اتصال"}
                        </span>
                      </td>
                      <td className="text-[10px] text-slate-400">
                        محل ثبت مرخصی / مأموریت / یادداشت پیگیری
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Section 4: Management Directives / Observations */}
        <div className="avoid-break border border-slate-300 bg-slate-50/60 rounded-xl p-3">
          <div className="text-[11px] font-black text-slate-900 mb-2">۴. توضیحات، ارزیابی کیفی و مصوبات مدیر دپارتمان / معاونت اجرایی:</div>
          <div className="space-y-2 text-[10px] text-slate-400">
            <div className="border-b border-dashed border-slate-300 pb-1.5 h-4" />
            <div className="border-b border-dashed border-slate-300 pb-1.5 h-4" />
          </div>
        </div>

        {/* Section 5: Official Signatures & Seal Frame */}
        <div className="avoid-break pt-4 border-t-2 border-slate-300">
          <div className="grid grid-cols-3 gap-4 text-center text-xs">
            <div className="border border-slate-300 bg-white p-3 rounded-xl space-y-6">
              <div className="font-black text-slate-800 text-[11px]">۱. تنظیم و بررسی اولیه</div>
              <div className="text-[10px] text-slate-500">مسئول هماهنگی / سرپرست دپارتمان</div>
              <div className="text-[9.5px] text-slate-400 pt-3 border-t border-slate-100">امضا و تاریخ</div>
            </div>

            <div className="border border-slate-300 bg-white p-3 rounded-xl space-y-6">
              <div className="font-black text-slate-800 text-[11px]">۲. تأیید امور اداری و انضباطی</div>
              <div className="text-[10px] text-slate-500">مدیریت منابع انسانی و عوامل</div>
              <div className="text-[9.5px] text-slate-400 pt-3 border-t border-slate-100">امضا و تاریخ</div>
            </div>

            <div className="border border-slate-300 bg-white p-3 rounded-xl space-y-6">
              <div className="font-black text-slate-800 text-[11px]">۳. تصویب نهایی مدیریت ارشد</div>
              <div className="text-[10px] text-slate-500">معاونت اجرایی / مدیرعامل استودیو</div>
              <div className="text-[9.5px] text-slate-400 pt-3 border-t border-slate-100">محل مهر رسمی و امضا</div>
            </div>
          </div>

          {/* Official Security Footer */}
          <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500">
            <span>استودیو خلاق روتلو • سامانه اختصاصی مدیریت پروژه‌ها و عوامل</span>
            <span className="font-mono">ROT-SYS-SECURED • صفحه ۱ از ۱</span>
            <span>تولید شده توسط سامانه هوشمند روتلو</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-400">در حال بارگذاری صفحه گزارش‌ها...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
