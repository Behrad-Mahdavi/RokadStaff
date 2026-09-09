"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  FileSpreadsheet,
  Flame,
  Users,
  AlertCircle,
  FileText,
  Printer,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import Modal from "@/components/Modal";
import {
  formatToJalali,
  getTehranDateString,
  toPersianDigits,
} from "@/lib/utils";
import PersianDatePicker from "@/components/PersianDatePicker";

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [activeMetric, setActiveMetric] = useState<"completionRate" | "onTimeRate">("completionRate");

  // Date range presets
  const todayStr = getTehranDateString();
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 14);
    return getTehranDateString(d);
  });
  const [to, setTo] = useState(todayStr);
  const [selectedDept, setSelectedDept] = useState("all");

  // Employee history modal
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employeeHistory, setEmployeeHistory] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Quick Range Presets
  const applyPreset = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    setFrom(getTehranDateString(d));
    setTo(todayStr);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("from", from);
      params.append("to", to);
      if (selectedDept !== "all") params.append("department", selectedDept);

      const [dashRes, trendRes] = await Promise.all([
        fetch(`/api/reporting/dashboard?${params.toString()}`),
        fetch(`/api/reporting/trend?metric=${activeMetric}&${params.toString()}`),
      ]);

      if (dashRes.ok) {
        const json = await dashRes.json();
        setData(json);
      }
      if (trendRes.ok) {
        const trendJson = await trendRes.json();
        setTrendData(trendJson.points || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [from, to, selectedDept, activeMetric]);

  const handleExportExcel = () => {
    const params = new URLSearchParams();
    params.append("from", from);
    params.append("to", to);
    if (selectedDept !== "all") params.append("department", selectedDept);
    window.open(`/api/reporting/export?${params.toString()}`, "_blank");
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleViewEmployeeHistory = async (empId: string) => {
    setSelectedEmployeeId(empId);
    setHistoryLoading(true);
    try {
      const res = await fetch(`/api/reporting/employee/${empId}/history?from=${from}&to=${to}`);
      if (res.ok) {
        const json = await res.json();
        setEmployeeHistory(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const kpis = data?.kpis || {
    completionRate: 0,
    onTimeRate: 0,
    totalSubmitted: 0,
    totalMissing: 0,
    totalOnTime: 0,
    totalLate: 0,
    activeEmployeeDays: 0,
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* ------------------------------------------------------------- */}
      {/* 1. INTERACTIVE SCREEN UI (Hidden when printing/saving to PDF) */}
      {/* ------------------------------------------------------------- */}
      <div className="screen-only space-y-6 sm:space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-ecosystem-light via-white to-club-light/40 dark:from-[#132824] dark:via-[#151C28] dark:to-[#1c152a] p-6 sm:p-7 rounded-3xl border-2 border-primary/20 shadow-[3px_3px_0_#59BBAF]">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-primary mb-1.5">
            <BarChart3 className="w-4 h-4" />
            <span>ماژول پیشرفته تحلیل و پایش</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-sec dark:text-white tracking-tight">گزارش‌گیری و تحلیل عملکرد</h1>
          <p className="text-xs sm:text-sm text-ink-normal/70 dark:text-gray-300 mt-1 font-medium">
            پایش هوشمند شاخص‌های عملکرد، انضباط کاری و دریافت خروجی اکسل و PDF
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto no-print">
          <button
            onClick={handleExportPDF}
            className="px-4 py-3 text-xs sm:text-sm rounded-xl bg-primary text-white flex items-center gap-2 font-bold shadow-sm hover:opacity-95 transition"
          >
            <Printer className="w-4 h-4" />
            <span>دریافت فایل PDF</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="rokad-btn-primary px-4 py-3 text-xs sm:text-sm rounded-xl flex items-center gap-2 font-bold shadow-[2.5px_2.5px_0_#1F413D]"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>دریافت فایل اکسل</span>
          </button>
        </div>
      </div>

      {/* Filter & Range Bar */}
      <div className="bg-white dark:bg-[#151C28] p-4 sm:p-5 rounded-3xl border border-[#EAEAEA] dark:border-gray-800 shadow-[2px_2px_0_#202A5A] dark:shadow-[2px_2px_0_#59BBAF] flex flex-col lg:flex-row items-center justify-between gap-4 no-print">
        {/* Preset Range Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <span className="text-xs sm:text-sm font-black text-ink-normal/70 dark:text-gray-300 ml-2">بازه سریع:</span>
          {[
            { label: "امروز", days: 0 },
            { label: "۷ روز اخیر", days: 7 },
            { label: "۱۴ روز اخیر", days: 14 },
            { label: "۳۰ روز اخیر", days: 30 },
          ].map((preset) => (
            <button
              key={preset.days}
              onClick={() => applyPreset(preset.days)}
              className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs sm:text-sm font-bold hover:bg-ecosystem-light dark:hover:bg-ecosystem-darker/50 hover:border-primary/40 hover:text-ecosystem-darker dark:text-gray-200 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Date Inputs & Dept */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="text-gray-500 dark:text-gray-400 font-bold text-xs">از:</span>
            <div className="w-40 sm:w-44">
              <PersianDatePicker
                value={from}
                onChange={(d) => setFrom(d)}
                placeholder="تاریخ شروع..."
              />
            </div>
            <span className="text-gray-500 dark:text-gray-400 font-bold text-xs mr-1">تا:</span>
            <div className="w-40 sm:w-44">
              <PersianDatePicker
                value={to}
                onChange={(d) => setTo(d)}
                placeholder="تاریخ پایان..."
              />
            </div>
          </div>

          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs sm:text-sm bg-gray-50 dark:bg-[#1C2536] dark:text-white focus:border-primary focus:outline-none font-bold text-sec dark:text-white"
          >
            <option value="all">تمام دپارتمان‌ها</option>
            <option value="پسرانه">پسرانه</option>
            <option value="دخترانه">دخترانه</option>
          </select>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="نرخ مشارکت کل"
          value={`٪${toPersianDigits(kpis.completionRate)}`}
          subtitle={`${toPersianDigits(kpis.totalSubmitted)} گزارش از ${toPersianDigits(kpis.activeEmployeeDays)} نفر-روز`}
          icon={TrendingUp}
          theme="ecosystem"
        />

        <StatCard
          title="نرخ ثبت به‌موقع"
          value={`٪${toPersianDigits(kpis.onTimeRate)}`}
          subtitle={`${toPersianDigits(kpis.totalOnTime || 0)} به‌موقع | ${toPersianDigits(kpis.totalLate || 0)} با تأخیر`}
          icon={Clock}
          theme="male"
        />

        <StatCard
          title="مجموع گزارش‌های ثبت‌شده"
          value={`${toPersianDigits(kpis.totalSubmitted)} گزارش`}
          subtitle="کل چک‌لیست‌های دریافتی در این بازه"
          icon={FileText}
          theme="college"
        />

        <StatCard
          title="مجموع غیبت در گزارش"
          value={`${toPersianDigits(kpis.totalMissing)} مورد`}
          subtitle="موارد عدم ثبت در روزهای کاری بازه"
          icon={AlertCircle}
          theme="club"
        />
      </div>

      {/* Interactive Trend Chart Card */}
      <div className="bg-white dark:bg-[#151C28] rounded-3xl p-5 sm:p-7 border border-[#EAEAEA] dark:border-gray-800 shadow-[3px_3px_0_#202A5A] dark:shadow-[3px_3px_0_#59BBAF]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-black text-sec dark:text-white">روند زمانی شاخص‌های مشارکت و نظم</h2>
            <p className="text-xs sm:text-sm text-ink-normal/60 dark:text-gray-400 mt-0.5 font-medium">
              نمودار مقایسه‌ای نوسانات نرخ ثبت گزارش در طول بازه زمانی انتخابی
            </p>
          </div>

          {/* Metric Toggle Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100 dark:bg-[#1C2536] rounded-2xl no-print">
            {[
              { id: "completionRate", label: "نرخ مشارکت گزارش" },
              { id: "onTimeRate", label: "نرخ به‌موقع بودن" },
            ].map((m: any) => (
              <button
                key={m.id}
                onClick={() => setActiveMetric(m.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeMetric === m.id
                    ? "bg-white dark:bg-[#121824] text-sec dark:text-white shadow-sm border border-gray-200 dark:border-gray-700"
                    : "text-ink-normal/60 dark:text-gray-400 hover:text-ink-normal"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Trend Bars */}
        {trendData.length === 0 ? (
          <div className="text-center py-16 text-sm text-ink-normal/50 dark:text-gray-400">
            داده‌ای برای ترسیم نمودار در این بازه یافت نشد.
          </div>
        ) : (
          <div className="space-y-3 pt-4">
            <div className="h-56 flex items-end gap-3 sm:gap-5 overflow-x-auto pb-4 pt-8 px-2 border-b border-gray-100 dark:border-gray-800">
              {trendData.map((pt, i) => (
                <div key={i} className="flex-1 min-w-[48px] flex flex-col items-center gap-2 group">
                  <div className="text-xs font-black text-ink-normal/70 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    ٪{toPersianDigits(pt.value)}
                  </div>
                  <div className="w-full max-w-[36px] h-36 bg-gray-100 dark:bg-gray-800 rounded-t-xl relative flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t-xl transition-all duration-500 ${
                        activeMetric === "completionRate" ? "bg-primary" : "bg-sec dark:bg-ecosystem-dark"
                      }`}
                      style={{ height: `${Math.max(8, pt.value)}%` }}
                    />
                  </div>
                  <div className="text-xs font-bold text-ink-normal/70 dark:text-gray-300 rotate-45 sm:rotate-0 mt-2 whitespace-nowrap">
                    {toPersianDigits(pt.dateJalali.slice(5))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm text-ink-normal/60 dark:text-gray-400 pt-3 px-2 font-medium">
              <span>راهنما: با نگه داشتن ماوس یا لمس هر ستون، درصد دقیق روز نمایش داده می‌شود.</span>
              <span className="font-bold text-sec dark:text-white">مجموع روزهای محاسبه‌شده: {toPersianDigits(trendData.length)} روز</span>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Employee Profile & Streak */}
      <Modal
        isOpen={!!selectedEmployeeId}
        onClose={() => {
          setSelectedEmployeeId(null);
          setEmployeeHistory(null);
        }}
        title={`پروفایل عملکرد ${employeeHistory?.employee?.fullName || ""}`}
        maxWidth="lg"
      >
        {historyLoading ? (
          <div className="py-12 text-center text-sm text-gray-400">در حال دریافت تاریخچه کارمند...</div>
        ) : employeeHistory ? (
          <div className="space-y-6">
            {/* Meta & Streak Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-ecosystem-light via-white to-college-light dark:from-[#152422] dark:via-[#151C28] dark:to-[#241d1a] border border-primary/20 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-sec dark:text-white">{employeeHistory.employee.fullName}</h3>
                <div className="text-xs sm:text-sm text-ink-normal/60 dark:text-gray-400 mt-0.5 font-medium">
                  {employeeHistory.employee.department || "پسرانه"} • {employeeHistory.employee.position || "همکار"}
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white dark:bg-[#151C28] px-4 py-2.5 rounded-2xl border border-college-normal/30 shadow-sm">
                <Flame className="w-5 h-5 text-college-normal animate-pulse" />
                <div className="text-right">
                  <div className="text-xs sm:text-sm font-black text-college-darker dark:text-college-light">
                    {toPersianDigits(employeeHistory.summary.streak)} روز متوالی
                  </div>
                  <div className="text-[11px] text-ink-normal/60 dark:text-gray-400 font-medium">توالی ثبت بدون وقفه</div>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-gray-50 dark:bg-[#1C2536] rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="text-xs sm:text-sm text-ink-normal/60 dark:text-gray-400 font-medium">تعداد کل گزارش‌ها</div>
                <div className="text-lg sm:text-xl font-black text-sec dark:text-white mt-1">
                  {toPersianDigits(employeeHistory.summary.totalSubmitted)}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-[#1C2536] rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="text-xs sm:text-sm text-ink-normal/60 dark:text-gray-400 font-medium">درصد به‌موقع بودن</div>
                <div className="text-lg sm:text-xl font-black text-primary mt-1">
                  ٪{toPersianDigits(employeeHistory.summary.onTimeRate)}
                </div>
              </div>
            </div>

            {/* Recent Reports List */}
            <div>
              <h4 className="text-xs sm:text-sm font-black text-sec dark:text-white mb-3">گزارش‌های ارسالی اخیر:</h4>
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {employeeHistory.reports.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-400">گزارشی در این بازه ثبت نشده است.</div>
                ) : (
                  employeeHistory.reports.map((rep: any) => (
                    <div key={rep.id} className="p-4 bg-white dark:bg-[#151C28] rounded-2xl border border-gray-200 dark:border-gray-800 text-xs sm:text-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sec dark:text-white">{rep.reportDateJalali}</span>
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                            rep.status === "on_time"
                              ? "bg-ecosystem-light dark:bg-ecosystem-darker/60 text-ecosystem-darker dark:text-ecosystem-light border border-primary/30"
                              : "bg-female-light dark:bg-female-darker/60 text-female-darker dark:text-female-light border border-female-normal/30"
                          }`}
                        >
                          {rep.status === "on_time" ? "به‌موقع" : "با تأخیر"}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-ink-normal/80 dark:text-gray-300 line-clamp-2 leading-relaxed">
                        {(rep.rawText || "").replace(/^\/report\s*/i, "").trim()}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. STATE-OF-THE-ART EXECUTIVE MANAGEMENT REPORT (PRINT ONLY) */}
      {/* ------------------------------------------------------------- */}
      <div className="print-only font-vazirmatn text-slate-900 space-y-5" dir="rtl">
        {/* Official Header */}
        <div className="border-b-[3px] border-slate-900 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-2xl border-2 border-slate-900 flex items-center justify-center p-1 bg-white shrink-0">
                <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-slate-600 tracking-wider">بنام خدا</div>
                <h1 className="text-lg font-black text-slate-950 mt-0.5">استودیو خلاق روتلو • گزارش جامع تحلیلی سازمان</h1>
                <p className="text-xs text-slate-700 font-bold mt-0.5">پایش کلان شاخص‌های انضباط، مشارکت پرسنل و بهره‌وری سازمانی</p>
              </div>
            </div>

            {/* Document Metadata Stamp */}
            <div className="border border-slate-300 bg-slate-50/80 rounded-xl p-2.5 text-[10.5px] space-y-1 min-w-[220px]">
              <div className="flex justify-between">
                <span className="font-bold text-slate-600">شماره ثبت سند:</span>
                <span className="font-bold text-slate-900">ROT-ANL-{toPersianDigits(Date.now().toString().slice(-6))}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-600">بازه ارزیابی:</span>
                <span className="font-bold text-slate-900">{from} الی {to}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-600">دپارتمان تحت بررسی:</span>
                <span className="font-bold text-slate-900">{selectedDept === "all" ? "کل سازمان" : `دپارتمان ${selectedDept}`}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200">
                <span className="font-bold text-slate-600">طبقه‌بندی:</span>
                <span className="font-black text-amber-900 bg-amber-100/80 px-1.5 py-0.2 rounded text-[9.5px]">محرمانه سازمانی</span>
              </div>
            </div>
          </div>
          {/* Teal Accent Line */}
          <div className="h-1 bg-gradient-to-l from-teal-600 via-slate-800 to-teal-700 rounded-full mt-3" />
        </div>

        {/* 1. Executive KPI Summary Tiles */}
        <div className="avoid-break">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              <span>۱. خلاصه شاخص‌های کلان عملکرد و انضباط سازمانی (Executive KPIs)</span>
            </h2>
            <span className="text-[10px] text-slate-500 font-medium">مبتنی بر عملکرد کل واحدهای فعال</span>
          </div>

          <div className="grid grid-cols-4 gap-2.5">
            {/* Tile 1 */}
            <div className="border border-emerald-300 rounded-xl p-3 bg-emerald-50/50 border-t-4 border-t-emerald-600 text-center">
              <div className="text-[11px] font-bold text-emerald-800">نرخ مشارکت گزارش‌ها</div>
              <div className="text-xl font-black text-emerald-700 my-1">
                ٪{toPersianDigits(kpis.completionRate)}
              </div>
              <div className="text-[10px] text-emerald-600 font-bold">میانگین کل دوره</div>
            </div>

            {/* Tile 2 */}
            <div className="border border-blue-300 rounded-xl p-3 bg-blue-50/50 border-t-4 border-t-blue-600 text-center">
              <div className="text-[11px] font-bold text-blue-800">شاخص تحویل به‌موقع</div>
              <div className="text-xl font-black text-blue-700 my-1">
                ٪{toPersianDigits(kpis.onTimeRate)}
              </div>
              <div className="text-[10px] text-blue-600">نرخ انضباط سازمانی</div>
            </div>

            {/* Tile 3 */}
            <div className="border border-slate-300 rounded-xl p-3 bg-slate-50 border-t-4 border-t-slate-700 text-center">
              <div className="text-[11px] font-bold text-slate-700">کل گزارش‌های دریافتی</div>
              <div className="text-xl font-black text-slate-900 my-1">
                {toPersianDigits(kpis.totalSubmitted)} <span className="text-xs font-normal">فقره</span>
              </div>
              <div className="text-[10px] text-slate-500">در بازه ارزیابی</div>
            </div>

            {/* Tile 4 */}
            <div className="border border-rose-300 rounded-xl p-3 bg-rose-50/50 border-t-4 border-t-rose-600 text-center">
              <div className="text-[11px] font-bold text-rose-800">موارد عدم ثبت (غیبت)</div>
              <div className="text-xl font-black text-rose-700 my-1">
                {toPersianDigits(kpis.totalMissing)} <span className="text-xs font-normal">مورد</span>
              </div>
              <div className="text-[10px] text-rose-600 font-bold">
                {kpis.totalMissing > 0 ? "نیازمند ممیزی اداری" : "بدون ثبت غیبت"}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Trend Summary Table */}
        <div className="avoid-break">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-teal-600" />
              <span>۲. پایش روزانه نوسانات مشارکت و انضباط سازمانی</span>
            </h2>
            <span className="text-[10px] text-slate-500 font-bold">
              تعداد روزهای پایش‌شده: {toPersianDigits(trendData.length)} روز
            </span>
          </div>

          {trendData.length === 0 ? (
            <div className="p-4 border-2 border-dashed border-slate-200 text-xs text-slate-500 text-center rounded-xl bg-slate-50">
              داده‌ای برای پایش در این بازه زمانی یافت نشد.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-300">
              <table className="executive-table text-center">
                <thead>
                  <tr>
                    <th className="w-10 text-center">ردیف</th>
                    <th className="w-32 text-center">تاریخ شمسی</th>
                    <th className="text-center">درصد مشارکت پرسنل</th>
                    <th className="w-48 text-center">سطح ارزیابی انضباطی</th>
                  </tr>
                </thead>
                <tbody>
                  {trendData.slice(0, 15).map((pt: any, idx: number) => {
                    const isHigh = pt.value >= 80;
                    const isMed = pt.value >= 50 && pt.value < 80;
                    return (
                      <tr key={idx}>
                        <td className="font-bold text-slate-600">{toPersianDigits(idx + 1)}</td>
                        <td className="font-bold text-slate-800 text-[10px]">{pt.dateJalali}</td>
                        <td className="font-black text-slate-900">٪{toPersianDigits(pt.value)}</td>
                        <td>
                          <span
                            className={`print-badge ${
                              isHigh
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                                : isMed
                                ? "bg-amber-50 text-amber-800 border-amber-300"
                                : "bg-rose-50 text-rose-800 border-rose-300"
                            }`}
                          >
                            {isHigh ? "عالی و منظم" : isMed ? "متوسط" : "نیازمند پیگیری"}
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

        {/* 3. Executive Analysis Notes */}
        <div className="avoid-break border border-slate-300 bg-slate-50/60 rounded-xl p-3">
          <div className="text-[11px] font-black text-slate-900 mb-2">۳. ارزیابی کیفی، راهکارها و دستورات مدیریت ارشد:</div>
          <div className="space-y-2 text-[10px] text-slate-400">
            <div className="border-b border-dashed border-slate-300 pb-1.5 h-4" />
            <div className="border-b border-dashed border-slate-300 pb-1.5 h-4" />
          </div>
        </div>

        {/* 4. Signatures and Sign-off */}
        <div className="avoid-break pt-4 border-t-2 border-slate-300">
          <div className="grid grid-cols-2 gap-6 text-center text-xs">
            <div className="border border-slate-300 bg-white p-3.5 rounded-xl space-y-7">
              <div className="font-black text-slate-800 text-[11px]">تأیید سرپرست پایش و کنترل پروژه</div>
              <div className="text-[10px] text-slate-400">محل امضا و تاریخ</div>
            </div>
            <div className="border border-slate-300 bg-white p-3.5 rounded-xl space-y-7">
              <div className="font-black text-slate-800 text-[11px]">تأیید نهایی مدیریت ارشد استودیو روتلو</div>
              <div className="text-[10px] text-slate-400">محل مهر رسمی و امضا</div>
            </div>
          </div>

          {/* Official Security Footer */}
          <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-500">
            <span>استودیو خلاق روتلو • سامانه هوشمند پایش عملکرد و تحلیل داده‌ها</span>
            <span className="font-bold">ROT-ANL-REPORT • محرمانه سازمانی</span>
            <span>صفحه ۱ از ۱</span>
          </div>
        </div>
      </div>
    </div>
  );
}
