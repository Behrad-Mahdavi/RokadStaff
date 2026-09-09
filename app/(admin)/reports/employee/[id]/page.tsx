"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  User,
  ArrowRight,
  Download,
  Calendar,
  Layers,
  CheckSquare,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  TrendingUp,
  Activity,
  AlertTriangle,
  FolderKanban,
  Printer,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import PersianDatePicker from "@/components/PersianDatePicker";
import { formatToJalali, formatTehranTime, toPersianDigits, getTehranDateString } from "@/lib/utils";

export default function UnifiedEmployeeReportPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"snapshot" | "rotello" | "daily">("snapshot");

  // Date filters (Default to last 30 days)
  const defaultTo = getTehranDateString();
  const defaultFrom = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return getTehranDateString(d);
  })();

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);

  const fetchReport = async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/reporting/employee/${employeeId}/unified?from=${fromDate}&to=${toDate}`
      );
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [employeeId, fromDate, toDate]);

  const handleExportExcel = () => {
    const url = `/api/reporting/employee/${employeeId}/unified/export?from=${fromDate}&to=${toDate}`;
    window.open(url, "_blank");
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto font-vazirmatn space-y-6">
      {/* ------------------------------------------------------------- */}
      {/* 1. INTERACTIVE SCREEN UI (Hidden when printing/saving to PDF) */}
      {/* ------------------------------------------------------------- */}
      <div className="screen-only space-y-6">
        {/* Top Navigation & Breadcrumb */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 no-print">
          <Link
            href="/reports/employee"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-ink-normal/60 hover:text-primary transition"
          >
            <ArrowRight className="w-4 h-4" />
            <span>بازگشت به لیست همکاران</span>
          </Link>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-xs sm:text-sm font-black shadow-sm hover:opacity-95 transition flex-1 sm:flex-initial"
            >
              <Printer className="w-4 h-4" />
              <span>دریافت فایل PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-green text-white text-xs sm:text-sm font-black shadow-sm hover:opacity-95 transition flex-1 sm:flex-initial"
            >
              <Download className="w-4 h-4" />
              <span>خروجی اکسل</span>
            </button>
          </div>
        </div>

        {/* Employee Profile Header & Date Range */}
        <div className="p-5 sm:p-6 bg-white dark:bg-[#151C28] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-primary to-ecosystem-dark text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-[3px_3px_0_#202A5A] dark:shadow-[3px_3px_0_#59BBAF] shrink-0">
              {data?.employee?.fullName ? data.employee.fullName.slice(0, 1) : "ک"}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg sm:text-2xl font-black text-sec dark:text-white">
                  {data?.employee?.fullName || "در حال دریافت..."}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-ecosystem-light dark:bg-ecosystem-darker/60 text-ecosystem-darker dark:text-ecosystem-light border border-primary/20">
                  {data?.employee?.role === "admin"
                    ? "مدیر کل"
                    : data?.employee?.role === "supervisor"
                    ? "سرپرست"
                    : "همکار"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-ink-normal/60 dark:text-gray-400 mt-1 font-medium">
                {data?.employee?.position || "همکار"} • دپارتمان {data?.employee?.department || "پسرانه"}
              </p>
            </div>
          </div>

          {/* Jalali Date Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-gray-50 dark:bg-[#1C2536] rounded-2xl border border-gray-200 dark:border-gray-700 w-full lg:w-auto no-print">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-ink-normal/60 dark:text-gray-400 shrink-0">از تاریخ:</span>
              <div className="flex-1 sm:w-40">
                <PersianDatePicker
                  value={fromDate}
                  onChange={(val) => setFromDate(val || defaultFrom)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-ink-normal/60 dark:text-gray-400 shrink-0">تا تاریخ:</span>
              <div className="flex-1 sm:w-40">
                <PersianDatePicker
                  value={toDate}
                  onChange={(val) => setToDate(val || defaultTo)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 overflow-x-auto pb-1 scrollbar-none no-print">
          <button
            onClick={() => setActiveTab("snapshot")}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs sm:text-sm font-black border-b-2 transition-all shrink-0 whitespace-nowrap ${
              activeTab === "snapshot"
                ? "border-primary text-primary bg-primary/5 dark:bg-primary/10 rounded-t-xl"
                : "border-transparent text-ink-normal/60 dark:text-gray-400 hover:text-sec dark:hover:text-white"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>وضعیت لحظه‌ای وظایف</span>
          </button>

          <button
            onClick={() => setActiveTab("rotello")}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs sm:text-sm font-black border-b-2 transition-all shrink-0 whitespace-nowrap ${
              activeTab === "rotello"
                ? "border-primary text-primary bg-primary/5 dark:bg-primary/10 rounded-t-xl"
                : "border-transparent text-ink-normal/60 dark:text-gray-400 hover:text-sec dark:hover:text-white"
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>عملکرد وظایف در بازه انتخابی</span>
          </button>

          <button
            onClick={() => setActiveTab("daily")}
            className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-xs sm:text-sm font-black border-b-2 transition-all shrink-0 whitespace-nowrap ${
              activeTab === "daily"
                ? "border-primary text-primary bg-primary/5 dark:bg-primary/10 rounded-t-xl"
                : "border-transparent text-ink-normal/60 dark:text-gray-400 hover:text-sec dark:hover:text-white"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>گزارش‌های روزانه تلگرام</span>
          </button>
        </div>

        {/* Tab Contents */}
        {loading ? (
          <div className="p-16 text-center text-xs text-gray-400 font-bold">
            در حال پردازش داده‌های یکپارچه همکار...
          </div>
        ) : !data ? (
          <div className="p-12 bg-white dark:bg-[#151C28] rounded-3xl border border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
            اطلاعاتی یافت نشد.
          </div>
        ) : (
          <>
            {/* TAB 1: Current Tasks Snapshot */}
            {activeTab === "snapshot" && (
              <div className="space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-5 bg-white dark:bg-[#151C28] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="text-xs text-ink-normal/60 dark:text-gray-400 font-bold mb-1">کل وظایف باز</div>
                    <div className="text-2xl font-black text-sec dark:text-white">
                      {toPersianDigits(data.currentTasksSnapshot.totalOpen)}
                    </div>
                  </div>

                  <div className="p-5 bg-white dark:bg-[#151C28] rounded-3xl border border-college-normal/30 bg-college-light/30 dark:bg-college-darker/20 shadow-sm">
                    <div className="text-xs text-college-darker dark:text-college-light font-bold mb-1">وظایف فوری</div>
                    <div className="text-2xl font-black text-college-normal">
                      {toPersianDigits(data.currentTasksSnapshot.priorityBreakdown.urgent)}
                    </div>
                  </div>

                  <div className="p-5 bg-white dark:bg-[#151C28] rounded-3xl border border-female-normal/30 bg-female-light/30 dark:bg-female-darker/20 shadow-sm">
                    <div className="text-xs text-female-darker dark:text-female-light font-bold mb-1">وظایف مهم</div>
                    <div className="text-2xl font-black text-female-normal">
                      {toPersianDigits(data.currentTasksSnapshot.priorityBreakdown.important)}
                    </div>
                  </div>

                  <div className="p-5 bg-white dark:bg-[#151C28] rounded-3xl border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 shadow-sm">
                    <div className="text-xs text-red-600 dark:text-red-400 font-bold mb-1">گذشته از مهلت مقرر</div>
                    <div className="text-2xl font-black text-red-600 dark:text-red-400">
                      {toPersianDigits(data.currentTasksSnapshot.overdueCount)}
                    </div>
                  </div>
                </div>

                {/* Open Tasks List */}
                <div className="bg-white dark:bg-[#151C28] rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
                  <h3 className="text-base font-black text-sec dark:text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-primary" />
                    <span>لیست تسک‌های در دست اقدام این همکار ({toPersianDigits(data.currentTasksSnapshot.openTasks.length)})</span>
                  </h3>

                  {data.currentTasksSnapshot.openTasks.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-4">در حال حاضر هیچ تسک بازی به این همکار منتسب نشده است.</p>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {data.currentTasksSnapshot.openTasks.map((task: any) => (
                        <div key={task.id} className="py-3.5 flex items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-sec dark:text-white">{task.title}</span>
                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  task.priority === "urgent"
                                    ? "bg-college-light text-college-darker"
                                    : task.priority === "important"
                                    ? "bg-female-light text-female-darker"
                                    : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                                }`}
                              >
                                {task.priority === "urgent"
                                  ? "فوری"
                                  : task.priority === "important"
                                  ? "مهم"
                                  : "عادی"}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-ink-normal/50 dark:text-gray-400 mt-1">
                              <span>{task.projectName}</span>
                              <span>•</span>
                              <span>وضعیت: {task.statusOrColumn}</span>
                            </div>
                          </div>

                          {task.deadline && (
                            <div
                              className={`text-xs font-bold px-3 py-1 rounded-xl shrink-0 ${
                                task.isOverdue
                                  ? "bg-red-100 text-red-600"
                                  : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
                              }`}
                            >
                              {formatToJalali(task.deadline)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Rotello Tasks Range Performance */}
            {activeTab === "rotello" && (
              <div className="space-y-6">
                <div className="p-6 bg-white dark:bg-[#151C28] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
                  <h3 className="text-base font-black text-sec dark:text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                      <span>تسک‌های تکمیل‌شده در این بازه ({toPersianDigits(data.rotelloTasksPerformance?.completedTasks?.length || 0)})</span>
                    </span>
                  </h3>

                  {data.rotelloTasksPerformance?.completedTasks?.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-4">در این بازه هیچ تسکی به وضعیت تکمیل‌شده منتقل نشده است.</p>
                  ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-800">
                      {data.rotelloTasksPerformance?.completedTasks?.map((task: any) => (
                        <div key={task.id} className="py-3 flex items-center justify-between">
                          <div>
                            <div className="text-sm font-bold text-sec dark:text-white">{task.title}</div>
                            <div className="text-xs text-ink-normal/50 dark:text-gray-400 mt-0.5">پروژه: {task.projectName}</div>
                          </div>
                          <div className="text-xs font-bold text-ink-normal/60 dark:text-gray-400">
                            تکمیل در: {formatToJalali(task.updatedAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: Daily Telegram Reports */}
            {activeTab === "daily" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="p-5 bg-white dark:bg-[#151C28] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <div className="text-xs text-ink-normal/60 dark:text-gray-400 font-bold mb-1">کل گزارش‌های ارسالی</div>
                    <div className="text-2xl font-black text-sec dark:text-white">
                      {toPersianDigits(data.dailyReportsSummary?.totalSubmitted || 0)}
                    </div>
                  </div>

                  <div className="p-5 bg-white dark:bg-[#151C28] rounded-3xl border border-primary/30 bg-ecosystem-light/30 dark:bg-ecosystem-darker/20 shadow-sm">
                    <div className="text-xs text-ecosystem-darker dark:text-ecosystem-light font-bold mb-1">درصد ثبت به‌موقع</div>
                    <div className="text-2xl font-black text-primary">
                      ٪{toPersianDigits(data.dailyReportsSummary?.onTimeRate || 0)}
                    </div>
                  </div>

                  <div className="p-5 bg-white dark:bg-[#151C28] rounded-3xl border border-college-normal/30 bg-college-light/30 dark:bg-college-darker/20 shadow-sm col-span-2 sm:col-span-1">
                    <div className="text-xs text-college-darker dark:text-college-light font-bold mb-1">تعداد روزهای تقویمی</div>
                    <div className="text-2xl font-black text-college-normal">
                      {toPersianDigits(data.dateRange?.totalDays || 0)} روز
                    </div>
                  </div>
                </div>

                {/* Reports Feed */}
                <div className="bg-white dark:bg-[#151C28] rounded-3xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm space-y-4">
                  <h3 className="text-base font-black text-sec dark:text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span>سوابق گزارش‌های کار ثبت‌شده ({toPersianDigits(data.dailyReportsSummary?.reports?.length || 0)})</span>
                  </h3>

                  {data.dailyReportsSummary?.reports?.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-4">در این بازه زمانی هیچ گزارش تلگرامی ثبت نشده است.</p>
                  ) : (
                    <div className="space-y-4">
                      {data.dailyReportsSummary?.reports?.map((rep: any) => (
                        <div
                          key={rep.id}
                          className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1C2536] space-y-2.5"
                        >
                          <div className="flex items-center justify-between text-xs font-bold border-b border-gray-200/50 dark:border-gray-700 pb-2">
                            <span className="text-sec dark:text-white flex items-center gap-2">
                              <span>📅 تاریخ: {formatToJalali(rep.reportDate)}</span>
                              <span className="text-ink-normal/40 dark:text-gray-500 font-bold text-[11px]">({formatTehranTime(rep.createdAt)})</span>
                            </span>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  rep.isOnTime
                                    ? "bg-ecosystem-light text-ecosystem-darker"
                                    : "bg-college-light text-college-darker"
                                }`}
                              >
                                {rep.isOnTime ? "به‌موقع" : "با تأخیر"}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs text-ink-normal dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                            {(rep.rawText || "").replace(/^\/report\s*/i, "").trim()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. SIMPLE, CLEAN & USEFUL EMPLOYEE PERFORMANCE REPORT (PRINT ONLY) */}
      {/* ------------------------------------------------------------- */}
      {data && (
        <div className="print-only text-slate-900 space-y-4" dir="rtl">
          {/* Clean Modern Header */}
          <div className="border-b border-slate-200 pb-3.5 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl border border-slate-200 flex items-center justify-center p-1 bg-white shrink-0">
                <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-950 leading-tight">
                  روتلو • کارنامه عملکرد همکار
                </h1>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {data?.employee?.fullName} • {data?.employee?.position || "همکار استودیو"} ({data?.employee?.department || "عمومی"})
                </div>
              </div>
            </div>

            <div className="text-left text-xs space-y-0.5">
              <div className="font-bold text-slate-900">
                بازه ارزیابی: {fromDate} الی {toDate}
              </div>
              <div className="text-[10.5px] text-slate-500 font-medium">
                زمان صدور: {formatToJalali(new Date())}
              </div>
            </div>
          </div>

          {/* Minimal KPI Metric Tiles */}
          <div className="grid grid-cols-5 gap-2.5 mb-4 avoid-break">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <div className="text-[11px] font-bold text-slate-600 mb-1">وظایف باز جاری</div>
              <div className="text-lg font-black text-slate-900">
                {toPersianDigits(data?.currentTasksSnapshot?.totalOpen || 0)} <span className="text-xs font-normal text-slate-500">مورد</span>
              </div>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 text-center">
              <div className="text-[11px] font-bold text-emerald-800 mb-1">وظایف تکمیل‌شده</div>
              <div className="text-lg font-black text-emerald-700">
                {toPersianDigits(data?.rotelloTasksPerformance?.completedTasks?.length || 0)} <span className="text-xs font-normal text-slate-500">مورد</span>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3 text-center">
              <div className="text-[11px] font-bold text-blue-800 mb-1">تعداد گزارش‌های ثبت‌شده</div>
              <div className="text-lg font-black text-blue-700">
                {toPersianDigits(data?.dailyReportsSummary?.totalSubmitted || 0)} <span className="text-xs font-normal text-slate-500">روز</span>
              </div>
            </div>

            <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-3 text-center">
              <div className="text-[11px] font-bold text-teal-800 mb-1">انضباط ثبت روزانه</div>
              <div className="text-lg font-black text-teal-700">
                ٪{toPersianDigits(data?.dailyReportsSummary?.onTimeRate || 0)}
              </div>
            </div>

            <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3 text-center">
              <div className="text-[11px] font-bold text-rose-800 mb-1">وظایف با تأخیر</div>
              <div className="text-lg font-black text-rose-700">
                {toPersianDigits(data?.currentTasksSnapshot?.overdueCount || 0)} <span className="text-xs font-normal text-slate-500">مورد</span>
              </div>
            </div>
          </div>

          {/* Section 1: Active Tasks Table */}
          <div className="avoid-break space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-900">
                وضعیت وظایف جاری در تابلوهای پروژه‌ها ({toPersianDigits(data?.currentTasksSnapshot?.openTasks?.length || 0)} مورد)
              </h2>
            </div>

            {data?.currentTasksSnapshot?.openTasks?.length === 0 ? (
              <div className="p-3 border border-dashed border-slate-200 text-xs text-slate-500 text-center rounded-xl bg-slate-50">
                در حال حاضر وظیفه جاری برای این همکار ثبت نشده است.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="executive-table">
                  <thead>
                    <tr>
                      <th className="w-8 text-center">ردیف</th>
                      <th>عنوان وظیفه</th>
                      <th className="w-36">نام پروژه</th>
                      <th className="w-28 text-center">ستون فعلی</th>
                      <th className="w-20 text-center">اولویت</th>
                      <th className="w-24 text-center">مهلت انجام</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.currentTasksSnapshot?.openTasks?.map((t: any, idx: number) => (
                      <tr key={t.id}>
                        <td className="text-center font-bold text-slate-600">{toPersianDigits(idx + 1)}</td>
                        <td className="font-bold text-slate-900">{t.title}</td>
                        <td className="text-slate-700 font-medium">{t.projectName}</td>
                        <td className="text-center font-bold text-slate-800">{t.statusOrColumn}</td>
                        <td className="text-center">
                          <span
                            className={`print-badge ${
                              t.priority === "urgent"
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : t.priority === "important"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {t.priority === "urgent" ? "فوری" : t.priority === "important" ? "مهم" : "عادی"}
                          </span>
                        </td>
                        <td className="text-center font-bold text-[10px] text-slate-700">
                          {t.deadline ? formatToJalali(t.deadline) : "بدون مهلت"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Daily Reports Summary Table */}
          <div className="avoid-break space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-900">
                گزیده گزارش‌های روزانه ثبت‌شده در بازه ارزیابی ({toPersianDigits(data?.dailyReportsSummary?.reports?.length || 0)} مورد)
              </h2>
            </div>

            {data?.dailyReportsSummary?.reports?.length === 0 ? (
              <div className="p-3 border border-dashed border-slate-200 text-xs text-slate-500 text-center rounded-xl bg-slate-50">
                هیچ گزارش کاری در این بازه زمانی به ثبت نرسیده است.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="executive-table">
                  <thead>
                    <tr>
                      <th className="w-8 text-center">ردیف</th>
                      <th className="w-24 text-center">تاریخ ثبت</th>
                      <th>شرح کامل فعالیت‌ها و دستاوردها</th>
                      <th className="w-20 text-center">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.dailyReportsSummary?.reports?.slice(0, 15).map((rep: any, idx: number) => (
                      <tr key={rep.id}>
                        <td className="text-center font-bold text-slate-600">{toPersianDigits(idx + 1)}</td>
                        <td className="text-center font-bold text-[10.5px] text-slate-800">
                          {formatToJalali(rep.reportDate)}
                        </td>
                        <td className="leading-relaxed text-[10.5px] text-slate-800">
                          {(rep.rawText || "").replace(/^\/report\s*/i, "").trim()}
                        </td>
                        <td className="text-center">
                          <span
                            className={`print-badge ${
                              rep.isOnTime
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-amber-50 text-amber-800 border-amber-200"
                            }`}
                          >
                            {rep.isOnTime ? "به‌موقع" : "با تأخیر"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Clean Minimal Footer */}
          <div className="avoid-break pt-3 mt-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500">
            <span>روتلو • سامانه مدیریت یکپارچه عملکرد همکاران</span>
            <span>زمان استخراج: {formatToJalali(new Date())}</span>
          </div>
        </div>
      )}
    </div>
  );
}
