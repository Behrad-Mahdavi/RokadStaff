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
      {/* 2. DEDICATED OFFICIAL EXECUTIVE MANAGEMENT REPORT (PRINT ONLY) */}
      {/* ------------------------------------------------------------- */}
      <div className="print-only font-vazirmatn text-black space-y-6" dir="rtl">
        {/* Official Header */}
        <div className="border-b-2 border-slate-900 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl border border-slate-800 flex items-center justify-center p-1 bg-slate-50">
                <img src="/icon.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900">استودیو روتلو • سامانه مدیریت عوامل</h1>
                <p className="text-xs text-slate-600 font-bold mt-0.5">گزارش رسمی و تحلیلی شاخص‌های عملکرد کل سازمان</p>
              </div>
            </div>
            <div className="text-left text-xs text-slate-700 font-medium space-y-0.5">
              <div><span className="font-bold">شماره گزارش:</span> <span className="font-mono">ROT-ORG-{toPersianDigits(Date.now().toString().slice(-5))}</span></div>
              <div><span className="font-bold">تاریخ صدور:</span> {formatToJalali(new Date())}</div>
              <div><span className="font-bold">بازه ارزیابی:</span> {from} تا {to}</div>
              <div><span className="font-bold">دپارتمان:</span> {selectedDept === "all" ? "تمام دپارتمان‌ها" : `دپارتمان ${selectedDept}`}</div>
            </div>
          </div>
        </div>

        {/* Executive KPI Summary Table */}
        <div className="avoid-break">
          <h2 className="text-sm font-black text-slate-900 mb-2">۱. خلاصه شاخص‌های کلان عملکرد و انضباط سازمانی</h2>
          <table className="text-xs text-center">
            <thead>
              <tr>
                <th>نرخ مشارکت گزارش‌ها</th>
                <th>نرخ ثبت به‌موقع</th>
                <th>کل گزارش‌های دریافتی</th>
                <th>موارد عدم ثبت (غیبت)</th>
                <th>کل روزهای کاری محاسبه‌شده</th>
              </tr>
            </thead>
            <tbody>
              <tr className="font-black text-sm">
                <td className="text-slate-900">٪{toPersianDigits(kpis.completionRate)}</td>
                <td className="text-slate-900">٪{toPersianDigits(kpis.onTimeRate)}</td>
                <td>{toPersianDigits(kpis.totalSubmitted)}</td>
                <td className={kpis.totalMissing > 0 ? "text-red-600 font-black" : ""}>
                  {toPersianDigits(kpis.totalMissing)} مورد
                </td>
                <td>{toPersianDigits(kpis.activeEmployeeDays)} نفر-روز</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Trend Summary Table */}
        <div className="avoid-break">
          <h2 className="text-sm font-black text-slate-900 mb-2">۲. پایش روزانه نوسانات مشارکت در طول بازه</h2>
          {trendData.length === 0 ? (
            <div className="p-3 border border-slate-200 text-xs text-slate-500 text-center rounded">داده‌ای در این بازه یافت نشد.</div>
          ) : (
            <table className="text-xs text-center">
              <thead>
                <tr>
                  <th className="w-12">ردیف</th>
                  <th className="w-32">تاریخ شمسی</th>
                  <th>شاخص مشارکت ثبت گزارش</th>
                  <th className="w-40">ارزیابی انضباط روزانه</th>
                </tr>
              </thead>
              <tbody>
                {trendData.slice(0, 15).map((pt: any, idx: number) => (
                  <tr key={idx}>
                    <td className="font-bold">{toPersianDigits(idx + 1)}</td>
                    <td className="font-mono">{pt.dateJalali}</td>
                    <td className="font-black">٪{toPersianDigits(pt.value)}</td>
                    <td className="font-bold">
                      {pt.value >= 80 ? (
                        <span className="text-emerald-700">عالی و منظم</span>
                      ) : pt.value >= 50 ? (
                        <span className="text-amber-700">متوسط</span>
                      ) : (
                        <span className="text-red-600">نیازمند پیگیری</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Signatures and Sign-off */}
        <div className="avoid-break pt-8 border-t-2 border-slate-300">
          <div className="grid grid-cols-2 gap-8 text-center text-xs">
            <div className="border border-slate-300 p-4 rounded-xl space-y-8">
              <div className="font-black text-slate-800">تأیید سرپرست پایش و کنترل پروژه</div>
              <div className="text-[11px] text-slate-400">محل امضا و تاریخ</div>
            </div>
            <div className="border border-slate-300 p-4 rounded-xl space-y-8">
              <div className="font-black text-slate-800">تأیید مدیریت ارشد استودیو روتلو</div>
              <div className="text-[11px] text-slate-400">محل مهر و امضای رسمی</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
