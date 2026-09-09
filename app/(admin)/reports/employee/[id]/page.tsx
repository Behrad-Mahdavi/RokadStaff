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
                          <div className="text-xs font-mono text-ink-normal/60 dark:text-gray-400">
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
                              <span className="text-ink-normal/40 dark:text-gray-500 font-mono text-[11px]">({formatTehranTime(rep.createdAt)})</span>
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
      {/* 2. DEDICATED OFFICIAL EXECUTIVE MANAGEMENT REPORT (PRINT ONLY) */}
      {/* ------------------------------------------------------------- */}
      {data && (
        <div className="print-only font-vazirmatn text-black space-y-5" dir="rtl">
          {/* Official Header */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl border border-slate-800 flex items-center justify-center p-1 bg-slate-50">
                  <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-slate-900">استودیو روتلو • سامانه مدیریت عوامل</h1>
                  <p className="text-xs text-slate-600 font-bold mt-0.5">کارنامه جامع و گزارش رسمی ارزیابی عملکرد همکار</p>
                </div>
              </div>
              <div className="text-left text-xs text-slate-700 font-medium space-y-0.5">
                <div><span className="font-bold">شماره گزارش:</span> <span className="font-mono">ROT-{toPersianDigits(data?.employee?.id?.replace(/\D/g, "") || "101")}-{toPersianDigits(Date.now().toString().slice(-4))}</span></div>
                <div><span className="font-bold">تاریخ صدور:</span> {formatToJalali(new Date())}</div>
                <div><span className="font-bold">بازه ارزیابی:</span> {fromDate} تا {toDate}</div>
              </div>
            </div>
          </div>

          {/* Personnel Profile Table */}
          <div className="avoid-break">
            <h2 className="text-sm font-black text-slate-900 mb-2">۱. مشخصات پرسنلی و سازمانی</h2>
            <table className="text-xs">
              <tbody>
                <tr>
                  <td className="bg-slate-100 font-bold w-1/6">نام و نام خانوادگی:</td>
                  <td className="w-2/6 font-black text-slate-900">{data?.employee?.fullName}</td>
                  <td className="bg-slate-100 font-bold w-1/6">دپارتمان / واحد:</td>
                  <td className="w-2/6 font-bold">{data?.employee?.department || "عمومی"}</td>
                </tr>
                <tr>
                  <td className="bg-slate-100 font-bold">سمت شغلی:</td>
                  <td className="font-medium">{data?.employee?.position || "همکار"}</td>
                  <td className="bg-slate-100 font-bold">سطح دسترسی:</td>
                  <td className="font-medium">{data?.employee?.role === "admin" ? "مدیر کل" : data?.employee?.role === "supervisor" ? "سرپرست" : "عضو همکار"}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Executive KPI Summary Table */}
          <div className="avoid-break">
            <h2 className="text-sm font-black text-slate-900 mb-2">۲. خلاصه شاخص‌های کلیدی عملکرد (Executive KPIs)</h2>
            <table className="text-xs text-center">
              <thead>
                <tr>
                  <th>کل وظایف جاری</th>
                  <th>وظایف تکمیل‌شده در بازه</th>
                  <th>گزارش‌های روزانه ثبت‌شده</th>
                  <th>نرخ انضباط و ثبت به‌موقع</th>
                  <th>وظایف معوق (تأخیر)</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-black text-sm">
                  <td>{toPersianDigits(data?.currentTasksSnapshot?.totalOpen || 0)}</td>
                  <td>{toPersianDigits(data?.rotelloTasksPerformance?.completedTasks?.length || 0)}</td>
                  <td>{toPersianDigits(data?.dailyReportsSummary?.totalSubmitted || 0)}</td>
                  <td>٪{toPersianDigits(data?.dailyReportsSummary?.onTimeRate || 0)}</td>
                  <td className={data?.currentTasksSnapshot?.overdueCount > 0 ? "text-red-600 font-black" : ""}>
                    {toPersianDigits(data?.currentTasksSnapshot?.overdueCount || 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Active Tasks Table */}
          <div className="avoid-break">
            <h2 className="text-sm font-black text-slate-900 mb-2">۳. فهرست وظایف جاری در پروژه‌ها (وضعیت لحظه‌ای)</h2>
            {data?.currentTasksSnapshot?.openTasks?.length === 0 ? (
              <div className="p-3 border border-slate-200 text-xs text-slate-500 text-center rounded">در حال حاضر وظیفه بازی برای این همکار ثبت نشده است.</div>
            ) : (
              <table className="text-xs">
                <thead>
                  <tr>
                    <th className="w-10 text-center">ردیف</th>
                    <th>عنوان وظیفه</th>
                    <th>نام پروژه</th>
                    <th className="w-24 text-center">وضعیت ستون</th>
                    <th className="w-16 text-center">اولویت</th>
                    <th className="w-24 text-center">مهلت انجام</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.currentTasksSnapshot?.openTasks?.map((t: any, idx: number) => (
                    <tr key={t.id}>
                      <td className="text-center font-bold">{toPersianDigits(idx + 1)}</td>
                      <td className="font-bold text-slate-900">{t.title}</td>
                      <td>{t.projectName}</td>
                      <td className="text-center">{t.statusOrColumn}</td>
                      <td className="text-center">{t.priority === "urgent" ? "فوری" : t.priority === "important" ? "مهم" : "عادی"}</td>
                      <td className="text-center font-mono">{t.deadline ? formatToJalali(t.deadline) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Daily Reports Summary Table */}
          <div className="avoid-break">
            <h2 className="text-sm font-black text-slate-900 mb-2">۴. خلاصه گزارش‌های روزانه ثبت‌شده در بازه</h2>
            {data?.dailyReportsSummary?.reports?.length === 0 ? (
              <div className="p-3 border border-slate-200 text-xs text-slate-500 text-center rounded">هیچ گزارشی در این بازه زمانی ثبت نشده است.</div>
            ) : (
              <table className="text-xs">
                <thead>
                  <tr>
                    <th className="w-10 text-center">ردیف</th>
                    <th className="w-24 text-center">تاریخ</th>
                    <th>شرح فعالیت‌ها و موارد گزارش‌شده</th>
                    <th className="w-20 text-center">وضعیت ثبت</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.dailyReportsSummary?.reports?.slice(0, 15).map((rep: any, idx: number) => (
                    <tr key={rep.id}>
                      <td className="text-center font-bold">{toPersianDigits(idx + 1)}</td>
                      <td className="text-center font-mono">{formatToJalali(rep.reportDate)}</td>
                      <td className="leading-relaxed">
                        {(rep.rawText || "").replace(/^\/report\s*/i, "").trim()}
                      </td>
                      <td className="text-center font-bold">
                        {rep.isOnTime ? "به‌موقع" : "با تأخیر"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Signatures and Sign-off */}
          <div className="avoid-break pt-6 border-t-2 border-slate-300">
            <div className="grid grid-cols-2 gap-8 text-center text-xs">
              <div className="border border-slate-300 p-4 rounded-xl space-y-8">
                <div className="font-black text-slate-800">تأیید و ارزیابی سرپرست مستقیم</div>
                <div className="text-[11px] text-slate-400">محل امضا و تاریخ</div>
              </div>
              <div className="border border-slate-300 p-4 rounded-xl space-y-8">
                <div className="font-black text-slate-800">تأیید مدیریت منابع انسانی / مدیر عامل</div>
                <div className="text-[11px] text-slate-400">محل مهر و امضای رسمی</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
