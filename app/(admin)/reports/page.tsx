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
      {/* 2. DEDICATED OFFICIAL EXECUTIVE DAILY MANAGEMENT REPORT (PRINT ONLY) */}
      {/* ------------------------------------------------------------- */}
      <div className="print-only font-vazirmatn text-black space-y-6" dir="rtl">
        {/* Header */}
        <div className="border-b-2 border-slate-900 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl border border-slate-800 flex items-center justify-center p-1 bg-slate-50">
                <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">استودیو روتلو • سامانه مدیریت عوامل</h1>
                <p className="text-xs text-slate-600 font-bold mt-0.5">صورتجلسه و گزارش رسمی روزانه عملکرد پرسنل</p>
              </div>
            </div>
            <div className="text-left text-xs text-slate-700 font-medium space-y-0.5">
              <div><span className="font-bold">شماره سند:</span> <span className="font-mono">ROT-DAY-{toPersianDigits(Date.now().toString().slice(-5))}</span></div>
              <div><span className="font-bold">تاریخ گزارش:</span> {formatToJalali(selectedDate, { showMonthName: true, includeDayName: true })}</div>
              <div><span className="font-bold">تاریخ چاپ:</span> {formatToJalali(new Date())}</div>
            </div>
          </div>
        </div>

        {/* Executive Daily Summary Table */}
        <div className="avoid-break">
          <h2 className="text-sm font-black text-slate-900 mb-2">۱. خلاصه وضعیت آماری روز</h2>
          <table className="text-xs text-center">
            <thead>
              <tr>
                <th>تعداد گزارش‌های ارسالی</th>
                <th>تعداد موارد عدم ثبت (غیبت)</th>
                <th>مجموع کل پرسنل فعال</th>
                <th>درصد تکمیل روزانه</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-black text-sm">
                <td className="text-emerald-700">{toPersianDigits(reports.length)} نفر</td>
                <td className={missingList.length > 0 ? "text-red-600 font-black" : ""}>{toPersianDigits(missingList.length)} نفر</td>
                <td>{toPersianDigits(reports.length + missingList.length)} نفر</td>
                <td>
                  ٪{toPersianDigits(
                    reports.length + missingList.length > 0
                      ? Math.round((reports.length / (reports.length + missingList.length)) * 100)
                      : 0
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Submitted Reports Table */}
        <div className="avoid-break">
          <h2 className="text-sm font-black text-slate-900 mb-2">۲. فهرست گزارش‌های کار ثبت‌شده در این تاریخ</h2>
          {reports.length === 0 ? (
            <div className="p-3 border border-slate-200 text-xs text-slate-500 text-center rounded">هیچ گزارشی برای این تاریخ ثبت نشده است.</div>
          ) : (
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="w-10 text-center">ردیف</th>
                  <th className="w-32">نام همکار</th>
                  <th className="w-24 text-center">دپارتمان</th>
                  <th className="w-20 text-center">ساعت ثبت</th>
                  <th className="w-20 text-center">وضعیت</th>
                  <th>شرح فعالیت‌های روزانه</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((rep: any, idx: number) => (
                  <tr key={rep.id}>
                    <td className="text-center font-bold">{toPersianDigits(idx + 1)}</td>
                    <td className="font-bold text-slate-900">{rep.employeeName}</td>
                    <td className="text-center">{rep.department || "پسرانه"}</td>
                    <td className="text-center font-mono">{rep.submittedAtTime}</td>
                    <td className="text-center font-bold">
                      {rep.status === "on_time" ? "به‌موقع" : "با تأخیر"}
                    </td>
                    <td className="leading-relaxed">
                      {(rep.rawText || "").replace(/^\/report\s*/i, "").trim()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Missing Employees Table */}
        {missingList.length > 0 && (
          <div className="avoid-break">
            <h2 className="text-sm font-black text-slate-900 mb-2">۳. فهرست همکاران بدون گزارش (غایب در سیستم)</h2>
            <table className="text-xs">
              <thead>
                <tr>
                  <th className="w-10 text-center">ردیف</th>
                  <th>نام و نام خانوادگی</th>
                  <th>دپارتمان</th>
                  <th>سمت سازمانی</th>
                  <th className="w-28 text-center">وضعیت اتصال تلگرام</th>
                </tr>
              </thead>
              <tbody>
                {missingList.map((emp: any, idx: number) => (
                  <tr key={emp.id}>
                    <td className="text-center font-bold">{toPersianDigits(idx + 1)}</td>
                    <td className="font-bold text-slate-900">{emp.fullName}</td>
                    <td>{emp.department || "پسرانه"}</td>
                    <td>{emp.position || "همکار"}</td>
                    <td className="text-center">{emp.isLinked ? "متصل" : "عدم اتصال"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Signatures */}
        <div className="avoid-break pt-8 border-t-2 border-slate-300">
          <div className="grid grid-cols-2 gap-8 text-center text-xs">
            <div className="border border-slate-300 p-4 rounded-xl space-y-8">
              <div className="font-black text-slate-800">تأیید سرپرست دپارتمان</div>
              <div className="text-[11px] text-slate-400">محل امضا و تاریخ</div>
            </div>
            <div className="border border-slate-300 p-4 rounded-xl space-y-8">
              <div className="font-black text-slate-800">تأیید مدیریت منابع انسانی</div>
              <div className="text-[11px] text-slate-400">محل مهر و امضای رسمی</div>
            </div>
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
