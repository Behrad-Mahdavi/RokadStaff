"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  Sparkles,
  TrendingUp,
  FolderKanban,
  CheckSquare,
  Activity,
  Layers,
  Award,
} from "lucide-react";
import PersianDatePicker from "@/components/PersianDatePicker";
import {
  formatToJalali,
  formatTehranTime,
  getTehranDateString,
  toPersianDigits,
} from "@/lib/utils";

export default function MyPerformanceScorecardPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "reports">("overview");

  // Default to last 30 days
  const defaultTo = getTehranDateString();
  const defaultFrom = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return getTehranDateString(d);
  })();

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);

  const fetchScorecard = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/reporting/employee/me/unified?from=${fromDate}&to=${toDate}`
      );
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load scorecard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScorecard();
  }, [fromDate, toDate]);

  const handlePrint = () => {
    window.print();
  };

  const handleQuickRange = (days: number) => {
    const end = getTehranDateString();
    const d = new Date();
    d.setDate(d.getDate() - days);
    const start = getTehranDateString(d);
    setFromDate(start);
    setToDate(end);
  };

  const employee = data?.employee || {};
  const rotelloMetrics = data?.rotelloMetrics || {
    totalAssigned: 0,
    completedInPeriod: 0,
    completedOnTime: 0,
    onTimeRate: 100,
    currentlyOpen: 0,
    currentlyOverdue: 0,
    averageTimeToCompleteDays: 0,
  };
  const dailyReportMetrics = data?.dailyReportMetrics || {
    totalExpectedDays: 0,
    totalSubmitted: 0,
    onTimeSubmitted: 0,
    lateSubmitted: 0,
    submissionRate: 100,
    totalTaskItemsReported: 0,
    onTimeRate: 100,
  };
  const tasks = data?.tasks || { open: [], completedInPeriod: [] };
  const dailyReportsList = data?.dailyReports || [];

  return (
    <div className="space-y-6 font-vazirmatn animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* 1. SCREEN UI HEADER & CONTROLS (Hidden during printing)       */}
      {/* ------------------------------------------------------------- */}
      <div className="no-print space-y-6">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-ecosystem-light via-white to-club-light/40 dark:from-[#151C28] dark:via-[#161E2C] dark:to-[#151C28] p-6 rounded-2xl border-2 border-primary/20 dark:border-gray-800 shadow-[3px_3px_0_#59BBAF]">
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-primary mb-1">
              <Award className="w-4 h-4" />
              <span>کارنامه جامع عملکرد و بهره‌وری</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-sec dark:text-white tracking-tight">
              کارنامه عملکرد من
            </h1>
            <p className="text-xs sm:text-sm text-ink-normal/70 dark:text-gray-400 mt-1 font-medium">
              مشاهده تجمیعی نرخ تحویل به‌موقع پروژه‌ها و انضباط گزارش‌دهی کاری
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="rokad-btn-sec px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ کارنامه / دریافت PDF</span>
            </button>
          </div>
        </div>

        {/* Date Filter & Quick Ranges */}
        <div className="p-4 sm:p-5 bg-white dark:bg-[#151C28] rounded-2xl border border-[#EAEAEA] dark:border-gray-800 shadow-[2.5px_2.5px_0_#202A5A] dark:shadow-[2.5px_2.5px_0_#59BBAF] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-ink-normal/70 dark:text-gray-400">
              بازه زمانی سریع:
            </span>
            <button
              onClick={() => handleQuickRange(7)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 dark:bg-gray-800 text-sec dark:text-white hover:bg-primary/20 hover:text-primary transition"
            >
              ۷ روز اخیر
            </button>
            <button
              onClick={() => handleQuickRange(30)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 dark:bg-gray-800 text-sec dark:text-white hover:bg-primary/20 hover:text-primary transition"
            >
              ۳۰ روز اخیر
            </button>
            <button
              onClick={() => handleQuickRange(90)}
              className="px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 dark:bg-gray-800 text-sec dark:text-white hover:bg-primary/20 hover:text-primary transition"
            >
              ۳ ماه اخیر
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 shrink-0">از تاریخ:</span>
              <PersianDatePicker value={fromDate} onChange={setFromDate} />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500 shrink-0">تا تاریخ:</span>
              <PersianDatePicker value={toDate} onChange={setToDate} />
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-800 gap-2">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-4 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "overview"
                ? "border-primary text-primary"
                : "border-transparent text-ink-normal/60 dark:text-gray-400 hover:text-ink-normal dark:hover:text-gray-200"
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>خلاصه شاخص‌ها و بهره‌وری</span>
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`pb-3 px-4 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "tasks"
                ? "border-primary text-primary"
                : "border-transparent text-ink-normal/60 dark:text-gray-400 hover:text-ink-normal dark:hover:text-gray-200"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            <span>وظایف روتلو ({toPersianDigits(tasks.open.length + tasks.completedInPeriod.length)})</span>
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`pb-3 px-4 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "reports"
                ? "border-primary text-primary"
                : "border-transparent text-ink-normal/60 dark:text-gray-400 hover:text-ink-normal dark:hover:text-gray-200"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>سوابق گزارش روزانه ({toPersianDigits(dailyReportsList.length)})</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. PRINTABLE HEADER (Visible ONLY during window.print)        */}
      {/* ------------------------------------------------------------- */}
      <div className="print-only mb-6 border-b-2 border-primary pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center font-black text-xl">
              رُکاد
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900">
                کارنامه رسمی عملکرد فردی همکار
              </h1>
              <p className="text-xs text-slate-500">
                سامانه پایش عملکرد و مدیریت وظایف روتلو
              </p>
            </div>
          </div>

          <div className="text-left text-xs text-slate-600 space-y-1">
            <div>
              همکار: <strong>{employee.fullName || "همکار"}</strong> ({employee.department || "عمومی"})
            </div>
            <div>
              بازه ارزیابی: {formatToJalali(fromDate)} تا {formatToJalali(toDate)}
            </div>
            <div>تاریخ چاپ: {formatToJalali(new Date())}</div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. CONTENT AREAS                                              */}
      {/* ------------------------------------------------------------- */}
      {loading ? (
        <div className="py-20 text-center text-xs font-bold text-gray-400 bg-white dark:bg-[#151C28] rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
          در حال بارگذاری و تحلیل شاخص‌های عملکرد...
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: OVERVIEW */}
          {(activeTab === "overview" || typeof window !== "undefined") && (
            <div className={`space-y-6 ${activeTab !== "overview" ? "hidden print:block" : ""}`}>
              {/* Primary KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {/* On-time task rate */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#151C28] border border-primary/30 dark:border-primary/20 shadow-[2.5px_2.5px_0_#59BBAF]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-normal/70 dark:text-gray-400">
                      تحویل به‌موقع وظایف
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-sec dark:text-white mt-3">
                    ٪{toPersianDigits(rotelloMetrics.onTimeRate)}
                  </div>
                  <div className="text-xs text-ink-normal/60 dark:text-gray-400 mt-1 font-medium">
                    {toPersianDigits(rotelloMetrics.completedOnTime)} از{" "}
                    {toPersianDigits(rotelloMetrics.completedInPeriod)} وظیفه تکمیل‌شده در موعد
                  </div>
                </div>

                {/* Rotello Tasks Done */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#151C28] border border-female-normal/30 dark:border-female-normal/20 shadow-[2.5px_2.5px_0_#E0195B]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-normal/70 dark:text-gray-400">
                      وظایف تکمیل‌شده در روتلو
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-female-light text-female-normal flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-sec dark:text-white mt-3">
                    {toPersianDigits(rotelloMetrics.completedInPeriod)} وظیفه
                  </div>
                  <div className="text-xs text-ink-normal/60 dark:text-gray-400 mt-1 font-medium">
                    {toPersianDigits(rotelloMetrics.currentlyOpen)} وظیفه فعال در دست اقدام
                  </div>
                </div>

                {/* Daily Report Rate */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#151C28] border border-club-normal/30 dark:border-club-normal/20 shadow-[2.5px_2.5px_0_#652D90]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-normal/70 dark:text-gray-400">
                      انضباط ارسال گزارش روزانه
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-club-light text-club-normal flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-sec dark:text-white mt-3">
                    ٪{toPersianDigits(dailyReportMetrics.onTimeRate)}
                  </div>
                  <div className="text-xs text-ink-normal/60 dark:text-gray-400 mt-1 font-medium">
                    {toPersianDigits(dailyReportMetrics.onTimeSubmitted)} روز ارسال به‌موقع از{" "}
                    {toPersianDigits(dailyReportMetrics.totalSubmitted)} گزارش
                  </div>
                </div>

                {/* Overdue tasks warning */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#151C28] border border-college-normal/30 dark:border-college-normal/20 shadow-[2.5px_2.5px_0_#F8A41D]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ink-normal/70 dark:text-gray-400">
                      وظایف معوقه / سررسیدگذشته
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-college-light text-college-normal flex items-center justify-center">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-sec dark:text-white mt-3">
                    {toPersianDigits(rotelloMetrics.currentlyOverdue)} وظیفه
                  </div>
                  <div className="text-xs text-ink-normal/60 dark:text-gray-400 mt-1 font-medium">
                    {rotelloMetrics.currentlyOverdue > 0
                      ? "نیازمند رسیدگی و بستن فوری"
                      : "وضعیت مطلوب - وظیفه عقب‌افتاده‌ای ندارید"}
                  </div>
                </div>
              </div>

              {/* Performance Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Rotello Project Performance */}
                <div className="p-6 bg-white dark:bg-[#151C28] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm sm:text-base font-black text-sec dark:text-white flex items-center gap-2">
                      <FolderKanban className="w-4 h-4 text-primary" />
                      <span>تحلیل عملکرد در پروژه‌های روتلو</span>
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60">
                      <span className="text-ink-normal/70 dark:text-gray-400">کل وظایف محوله:</span>
                      <span className="font-black text-sec dark:text-white">
                        {toPersianDigits(rotelloMetrics.totalAssigned)} وظیفه
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60">
                      <span className="text-ink-normal/70 dark:text-gray-400">تکمیل‌شده در این بازه:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        {toPersianDigits(rotelloMetrics.completedInPeriod)} وظیفه
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60">
                      <span className="text-ink-normal/70 dark:text-gray-400">وظایف باز و در حال انجام:</span>
                      <span className="font-black text-sec dark:text-white">
                        {toPersianDigits(rotelloMetrics.currentlyOpen)} وظیفه
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <span className="text-ink-normal/70 dark:text-gray-400">میانگین زمان تکمیل:</span>
                      <span className="font-black text-sec dark:text-white">
                        {toPersianDigits(rotelloMetrics.averageTimeToCompleteDays || 1)} روز
                      </span>
                    </div>
                  </div>
                </div>

                {/* Daily Reports Discipline */}
                <div className="p-6 bg-white dark:bg-[#151C28] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="text-sm sm:text-base font-black text-sec dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-club-normal" />
                      <span>انضباط و دقت گزارش‌دهی روزانه</span>
                    </h3>
                  </div>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60">
                      <span className="text-ink-normal/70 dark:text-gray-400">کل روزهای گزارش‌شده:</span>
                      <span className="font-black text-sec dark:text-white">
                        {toPersianDigits(dailyReportMetrics.totalSubmitted)} روز
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60">
                      <span className="text-ink-normal/70 dark:text-gray-400">گزارش‌های ارسال به‌موقع:</span>
                      <span className="font-black text-emerald-600 dark:text-emerald-400">
                        {toPersianDigits(dailyReportMetrics.onTimeSubmitted)} روز
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60">
                      <span className="text-ink-normal/70 dark:text-gray-400">گزارش‌های با تاخیر:</span>
                      <span className="font-black text-amber-600 dark:text-amber-400">
                        {toPersianDigits(dailyReportMetrics.lateSubmitted)} روز
                      </span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <span className="text-ink-normal/70 dark:text-gray-400">مجموع آیتم‌های گزارش‌شده:</span>
                      <span className="font-black text-sec dark:text-white">
                        {toPersianDigits(dailyReportMetrics.totalTaskItemsReported)} آیتم کاری
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TASKS BREAKDOWN */}
          {(activeTab === "tasks" || typeof window !== "undefined") && (
            <div className={`space-y-6 ${activeTab !== "tasks" ? "hidden print:block" : ""}`}>
              {/* Currently Open Tasks */}
              <div className="bg-white dark:bg-[#151C28] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-sm space-y-4">
                <h3 className="text-sm sm:text-base font-black text-sec dark:text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-primary" />
                  <span>وظایف فعال و در دست اقدام من ({toPersianDigits(tasks.open.length)})</span>
                </h3>

                {tasks.open.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">
                    هیچ وظیفه بازی در دست اقدام نیست.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tasks.open.map((t: any) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl border border-gray-200/80 dark:border-gray-700/60 bg-gray-50/50 dark:bg-[#121824] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-black text-sec dark:text-white text-xs sm:text-sm">
                            {t.title}
                          </div>
                          <div className="text-ink-normal/60 dark:text-gray-400 text-[11px] mt-0.5 flex items-center gap-2">
                            <span>پروژه: {t.projectName || "نامشخص"}</span>
                            <span>•</span>
                            <span>ستون: {t.columnName || "بورد"}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {t.deadline && (
                            <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              مهلت: {formatToJalali(t.deadline)}
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-md bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-[11px]">
                            {t.priority === "urgent"
                              ? "فوری"
                              : t.priority === "high"
                              ? "بالا"
                              : "عادی"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Completed Tasks in Period */}
              <div className="bg-white dark:bg-[#151C28] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-sm space-y-4">
                <h3 className="text-sm sm:text-base font-black text-sec dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>
                    وظایف تکمیل‌شده در بازه ارزیابی ({toPersianDigits(tasks.completedInPeriod.length)})
                  </span>
                </h3>

                {tasks.completedInPeriod.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">
                    وظیفه‌ای در این بازه تکمیل نشده است.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tasks.completedInPeriod.map((t: any) => (
                      <div
                        key={t.id}
                        className="p-3 rounded-xl border border-emerald-200/50 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-950/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                      >
                        <div>
                          <div className="font-bold text-sec dark:text-white">
                            {t.title}
                          </div>
                          <div className="text-ink-normal/60 dark:text-gray-400 text-[11px] mt-0.5">
                            پروژه: {t.projectName || "عمومی"}
                          </div>
                        </div>

                        <div className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">
                          تکمیل‌شده
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: DAILY REPORTS LIST */}
          {(activeTab === "reports" || typeof window !== "undefined") && (
            <div className={`space-y-6 ${activeTab !== "reports" ? "hidden print:block" : ""}`}>
              <div className="bg-white dark:bg-[#151C28] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-sm space-y-4">
                <h3 className="text-sm sm:text-base font-black text-sec dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-club-normal" />
                  <span>گزارش‌های روزانه ثبت‌شده در بازه ({toPersianDigits(dailyReportsList.length)})</span>
                </h3>

                {dailyReportsList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">
                    گزارشی در این بازه زمانی ثبت نشده است.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {dailyReportsList.map((r: any) => {
                      const isOnTime = r.status === "on_time";
                      return (
                        <div
                          key={r.id}
                          className="p-3.5 rounded-xl border border-gray-200/80 dark:border-gray-700/60 bg-gray-50/50 dark:bg-[#121824] space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-black text-sec dark:text-white">
                              تاریخ: {formatToJalali(r.reportDate, { showMonthName: true, includeDayName: true })}
                            </span>
                            <span
                              className={`text-[11px] font-black px-2 py-0.5 rounded-md ${
                                isOnTime
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                              }`}
                            >
                              {isOnTime ? "به‌موقع" : "با تاخیر"}
                            </span>
                          </div>

                          <div className="text-ink-normal/80 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {r.rawText}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
