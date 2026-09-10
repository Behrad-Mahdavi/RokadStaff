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
  const currentTasksSnapshot = data?.currentTasksSnapshot || {
    totalOpen: 0,
    priorityBreakdown: { urgent: 0, important: 0, normal: 0 },
    overdueCount: 0,
    openTasks: [],
  };
  const rotelloActivity = data?.rotelloActivity || {
    completedTasksCount: 0,
    completedTasks: [],
    totalTasksTouched: 0,
    onTimeCompletionRate: 100,
    averageCycleDays: 1,
  };
  const dailyReportsActivity = data?.dailyReportsActivity || {
    totalSubmitted: 0,
    onTimeCount: 0,
    lateCount: 0,
    onTimeRate: 100,
    missingDatesCount: 0,
    reports: [],
  };

  return (
    <div className="space-y-6 font-vazirmatn animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* ------------------------------------------------------------- */}
      {/* 1. SCREEN UI (Hidden when printing/saving to PDF)             */}
      {/* ------------------------------------------------------------- */}
      <div className="screen-only space-y-6">
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
            <span>
              وظایف روتلو (
              {toPersianDigits(
                (currentTasksSnapshot.openTasks?.length || 0) +
                  (rotelloActivity.completedTasks?.length || 0)
              )}
              )
            </span>
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
            <span>
              سوابق گزارش روزانه (
              {toPersianDigits(dailyReportsActivity.reports?.length || 0)}
              )
            </span>
          </button>
        </div>

        {/* Screen Content */}
        {loading ? (
          <div className="py-20 text-center text-xs font-bold text-gray-400 bg-white dark:bg-[#151C28] rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
            در حال بارگذاری و تحلیل شاخص‌های عملکرد...
          </div>
        ) : (
          <div className="space-y-6">
            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6">
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
                      ٪{toPersianDigits(rotelloActivity.onTimeCompletionRate)}
                    </div>
                    <div className="text-xs text-ink-normal/60 dark:text-gray-400 mt-1 font-medium">
                      {toPersianDigits(rotelloActivity.completedTasksCount)} وظیفه تکمیل‌شده در موعد
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
                      {toPersianDigits(rotelloActivity.completedTasksCount)} وظیفه
                    </div>
                    <div className="text-xs text-ink-normal/60 dark:text-gray-400 mt-1 font-medium">
                      {toPersianDigits(currentTasksSnapshot.totalOpen)} وظیفه فعال در دست اقدام
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
                      ٪{toPersianDigits(dailyReportsActivity.onTimeRate)}
                    </div>
                    <div className="text-xs text-ink-normal/60 dark:text-gray-400 mt-1 font-medium">
                      {toPersianDigits(dailyReportsActivity.onTimeCount)} روز ارسال به‌موقع از{" "}
                      {toPersianDigits(dailyReportsActivity.totalSubmitted)} گزارش
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
                      {toPersianDigits(currentTasksSnapshot.overdueCount)} وظیفه
                    </div>
                    <div className="text-xs text-ink-normal/60 dark:text-gray-400 mt-1 font-medium">
                      {currentTasksSnapshot.overdueCount > 0
                        ? "نیازمند رسیدگی و اقدام فوری"
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
                        <span className="text-ink-normal/70 dark:text-gray-400">کل وظایف در گردش:</span>
                        <span className="font-black text-sec dark:text-white">
                          {toPersianDigits(rotelloActivity.totalTasksTouched || currentTasksSnapshot.totalOpen)} وظیفه
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60">
                        <span className="text-ink-normal/70 dark:text-gray-400">تکمیل‌شده در این بازه:</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          {toPersianDigits(rotelloActivity.completedTasksCount)} وظیفه
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60">
                        <span className="text-ink-normal/70 dark:text-gray-400">وظایف باز و جاری:</span>
                        <span className="font-black text-sec dark:text-white">
                          {toPersianDigits(currentTasksSnapshot.totalOpen)} وظیفه
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <span className="text-ink-normal/70 dark:text-gray-400">میانگین چرخه تکمیل:</span>
                        <span className="font-black text-sec dark:text-white">
                          {toPersianDigits(rotelloActivity.averageCycleDays || 1)} روز
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
                          {toPersianDigits(dailyReportsActivity.totalSubmitted)} روز
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60">
                        <span className="text-ink-normal/70 dark:text-gray-400">گزارش‌های ارسال به‌موقع:</span>
                        <span className="font-black text-emerald-600 dark:text-emerald-400">
                          {toPersianDigits(dailyReportsActivity.onTimeCount)} روز
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800/60">
                        <span className="text-ink-normal/70 dark:text-gray-400">گزارش‌های با تاخیر:</span>
                        <span className="font-black text-amber-600 dark:text-amber-400">
                          {toPersianDigits(dailyReportsActivity.lateCount)} روز
                        </span>
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <span className="text-ink-normal/70 dark:text-gray-400">روزهای بدون ثبت گزارش:</span>
                        <span className="font-black text-rose-600 dark:text-rose-400">
                          {toPersianDigits(dailyReportsActivity.missingDatesCount)} روز
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: TASKS */}
            {activeTab === "tasks" && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-[#151C28] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-sm space-y-4">
                  <h3 className="text-sm sm:text-base font-black text-sec dark:text-white flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-primary" />
                    <span>وظایف فعال و در دست اقدام من ({toPersianDigits(currentTasksSnapshot.openTasks.length)})</span>
                  </h3>

                  {currentTasksSnapshot.openTasks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400">
                      هیچ وظیفه بازی در دست اقدام نیست.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {currentTasksSnapshot.openTasks.map((t: any) => (
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
                              <span>ستون: {t.columnName || t.statusOrColumn || "بورد"}</span>
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
                                : t.priority === "important"
                                ? "مهم"
                                : "عادی"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white dark:bg-[#151C28] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-sm space-y-4">
                  <h3 className="text-sm sm:text-base font-black text-sec dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span>
                      وظایف تکمیل‌شده در بازه ارزیابی ({toPersianDigits(rotelloActivity.completedTasks?.length || 0)})
                    </span>
                  </h3>

                  {(rotelloActivity.completedTasks?.length || 0) === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400">
                      وظیفه‌ای در این بازه تکمیل نشده است.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {rotelloActivity.completedTasks.map((t: any) => (
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

            {/* TAB 3: REPORTS */}
            {activeTab === "reports" && (
              <div className="bg-white dark:bg-[#151C28] rounded-2xl border border-gray-200 dark:border-gray-800 p-5 sm:p-6 shadow-sm space-y-4">
                <h3 className="text-sm sm:text-base font-black text-sec dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-club-normal" />
                  <span>
                    گزارش‌های روزانه ثبت‌شده در بازه ({toPersianDigits(dailyReportsActivity.reports?.length || 0)})
                  </span>
                </h3>

                {(dailyReportsActivity.reports?.length || 0) === 0 ? (
                  <div className="py-8 text-center text-xs text-gray-400">
                    گزارشی در این بازه زمانی ثبت نشده است.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {dailyReportsActivity.reports.map((r: any) => {
                      const isOnTime = r.isOnTime !== undefined ? r.isOnTime : r.status === "on_time";
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
            )}
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. OFFICIAL EXECUTIVE PRINT REPORT (EXACT ADMIN PDF DESIGN)   */}
      {/* ------------------------------------------------------------- */}
      {data && (
        <div className="print-only bg-white text-slate-900 space-y-4" dir="rtl">
          {/* Clean Modern Header */}
          <div className="border-b border-slate-200 pb-3.5 mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                <img src="/icon.png" alt="لوگوی روتلو" className="w-full h-full object-cover" />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-950 leading-tight">
                  روتلو • کارنامه عملکرد همکار
                </h1>
                <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                  {employee.fullName} • {employee.position || "همکار روتلو"} ({employee.department || "عمومی"})
                </div>
              </div>
            </div>

            <div className="text-left text-xs space-y-0.5">
              <div className="font-bold text-slate-900">
                بازه ارزیابی: {formatToJalali(fromDate)} الی {formatToJalali(toDate)}
              </div>
              <div className="text-[10.5px] text-slate-500 font-medium">
                زمان صدور: {formatToJalali(new Date())}
              </div>
            </div>
          </div>

          {/* Minimal 5-Tile KPI Metrics Grid */}
          <div className="grid grid-cols-5 gap-2.5 mb-4 avoid-break">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
              <div className="text-[11px] font-bold text-slate-600 mb-1">وظایف باز جاری</div>
              <div className="text-lg font-black text-slate-900">
                {toPersianDigits(currentTasksSnapshot.totalOpen || 0)}{" "}
                <span className="text-xs font-normal text-slate-500">مورد</span>
              </div>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 text-center">
              <div className="text-[11px] font-bold text-emerald-800 mb-1">وظایف تکمیل‌شده</div>
              <div className="text-lg font-black text-emerald-700">
                {toPersianDigits(rotelloActivity.completedTasksCount || 0)}{" "}
                <span className="text-xs font-normal text-slate-500">مورد</span>
              </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3 text-center">
              <div className="text-[11px] font-bold text-blue-800 mb-1">تعداد گزارش‌های ثبت‌شده</div>
              <div className="text-lg font-black text-blue-700">
                {toPersianDigits(dailyReportsActivity.totalSubmitted || 0)}{" "}
                <span className="text-xs font-normal text-slate-500">روز</span>
              </div>
            </div>

            <div className="bg-teal-50/50 border border-teal-200 rounded-xl p-3 text-center">
              <div className="text-[11px] font-bold text-teal-800 mb-1">انضباط ثبت روزانه</div>
              <div className="text-lg font-black text-teal-700">
                ٪{toPersianDigits(dailyReportsActivity.onTimeRate || 0)}
              </div>
            </div>

            <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3 text-center">
              <div className="text-[11px] font-bold text-rose-800 mb-1">وظایف با تأخیر</div>
              <div className="text-lg font-black text-rose-700">
                {toPersianDigits(currentTasksSnapshot.overdueCount || 0)}{" "}
                <span className="text-xs font-normal text-slate-500">مورد</span>
              </div>
            </div>
          </div>

          {/* Section 1: Active Tasks Table */}
          <div className="avoid-break space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-black text-slate-900">
                وضعیت وظایف جاری در تابلوهای پروژه‌ها (
                {toPersianDigits(currentTasksSnapshot.openTasks?.length || 0)} مورد)
              </h2>
            </div>

            {currentTasksSnapshot.openTasks?.length === 0 ? (
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
                    {currentTasksSnapshot.openTasks.map((t: any, idx: number) => (
                      <tr key={t.id}>
                        <td className="text-center font-bold text-slate-600">
                          {toPersianDigits(idx + 1)}
                        </td>
                        <td className="font-bold text-slate-900">{t.title}</td>
                        <td className="text-slate-700 font-medium">{t.projectName}</td>
                        <td className="text-center font-bold text-slate-800">
                          {t.columnName || t.statusOrColumn || "در حال انجام"}
                        </td>
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
                            {t.priority === "urgent"
                              ? "فوری"
                              : t.priority === "important"
                              ? "مهم"
                              : "عادی"}
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
                گزیده گزارش‌های روزانه ثبت‌شده در بازه ارزیابی (
                {toPersianDigits(dailyReportsActivity.reports?.length || 0)} مورد)
              </h2>
            </div>

            {dailyReportsActivity.reports?.length === 0 ? (
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
                    {dailyReportsActivity.reports.slice(0, 15).map((rep: any, idx: number) => {
                      const isOnTime =
                        rep.isOnTime !== undefined ? rep.isOnTime : rep.status === "on_time";
                      return (
                        <tr key={rep.id}>
                          <td className="text-center font-bold text-slate-600">
                            {toPersianDigits(idx + 1)}
                          </td>
                          <td className="text-center font-bold text-[10.5px] text-slate-800">
                            {formatToJalali(rep.reportDate)}
                          </td>
                          <td className="leading-relaxed text-[10.5px] text-slate-800">
                            {(rep.rawText || "").replace(/^\/report\s*/i, "").trim()}
                          </td>
                          <td className="text-center">
                            <span
                              className={`print-badge ${
                                isOnTime
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {isOnTime ? "به‌موقع" : "با تأخیر"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
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
