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
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-ecosystem-light via-white to-club-light/40 p-6 sm:p-7 rounded-3xl border-2 border-primary/20 shadow-[3px_3px_0_#59BBAF]">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-primary mb-1.5">
            <BarChart3 className="w-4 h-4" />
            <span>ماژول پیشرفته گزارش‌گیری و آنالیتیکس</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-sec tracking-tight">تحلیل و گزارش‌گیری جامع عملکرد</h1>
          <p className="text-xs sm:text-sm text-ink-normal/70 mt-1 font-medium">
            پایش هوشمند متریک‌های ثبت گزارش کار، انضباط کاری و دریافت خروجی اکسل
          </p>
        </div>

        <button
          onClick={handleExportExcel}
          className="rokad-btn-primary px-5 py-3.5 text-xs sm:text-sm rounded-xl flex items-center gap-2 font-bold shadow-[2.5px_2.5px_0_#1F413D] self-start md:self-auto"
        >
          <FileSpreadsheet className="w-5 h-5" />
          <span>دانلود خروجی اکسل (Excel)</span>
        </button>
      </div>

      {/* Filter & Range Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#EAEAEA] shadow-[2px_2px_0_#202A5A] flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Preset Range Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <span className="text-xs sm:text-sm font-black text-ink-normal/70 ml-2">بازه سریع:</span>
          {[
            { label: "امروز", days: 0 },
            { label: "۷ روز اخیر", days: 7 },
            { label: "۱۴ روز اخیر", days: 14 },
            { label: "۳۰ روز اخیر", days: 30 },
          ].map((preset) => (
            <button
              key={preset.days}
              onClick={() => applyPreset(preset.days)}
              className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm font-bold hover:bg-ecosystem-light hover:border-primary/40 hover:text-ecosystem-darker transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Date Inputs & Dept */}
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="text-gray-500 font-bold text-xs">از:</span>
            <div className="w-40 sm:w-44">
              <PersianDatePicker
                value={from}
                onChange={(d) => setFrom(d)}
                placeholder="تاریخ شروع..."
              />
            </div>
            <span className="text-gray-500 font-bold text-xs mr-1">تا:</span>
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
            className="px-3.5 py-2 rounded-xl border border-gray-200 text-xs sm:text-sm bg-gray-50 focus:border-primary focus:outline-none font-bold text-sec"
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
          title="نرخ مشارکت (Completion Rate)"
          value={`٪${toPersianDigits(kpis.completionRate)}`}
          subtitle={`${toPersianDigits(kpis.totalSubmitted)} گزارش از ${toPersianDigits(kpis.activeEmployeeDays)} نفر-روز`}
          icon={TrendingUp}
          theme="ecosystem"
        />

        <StatCard
          title="نرخ به‌موقع بودن (On-Time Rate)"
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
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-black text-sec">روند زمانی شاخص‌های مشارکت و نظم</h2>
            <p className="text-xs sm:text-sm text-ink-normal/60 mt-0.5 font-medium">
              نمودار مقایسه‌ای نوسانات نرخ ثبت گزارش در طول بازه زمانی انتخابی
            </p>
          </div>

          {/* Metric Toggle Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100 rounded-2xl">
            {[
              { id: "completionRate", label: "نرخ مشارکت گزارش" },
              { id: "onTimeRate", label: "نرخ به‌موقع بودن" },
            ].map((m: any) => (
              <button
                key={m.id}
                onClick={() => setActiveMetric(m.id)}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  activeMetric === m.id
                    ? "bg-white text-sec shadow-sm border border-gray-200"
                    : "text-ink-normal/60 hover:text-ink-normal"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Visual Trend Bars */}
        {trendData.length === 0 ? (
          <div className="text-center py-16 text-sm text-ink-normal/50">
            داده‌ای برای ترسیم نمودار در این بازه یافت نشد.
          </div>
        ) : (
          <div className="space-y-3 pt-4">
            <div className="h-56 flex items-end gap-3 sm:gap-5 overflow-x-auto pb-4 pt-8 px-2 border-b border-gray-100">
              {trendData.map((pt, i) => (
                <div key={i} className="flex-1 min-w-[48px] flex flex-col items-center gap-2 group">
                  <div className="text-xs font-black text-ink-normal/70 opacity-0 group-hover:opacity-100 transition-opacity">
                    ٪{toPersianDigits(pt.value)}
                  </div>
                  <div className="w-full max-w-[36px] h-36 bg-gray-100 rounded-t-xl relative flex items-end overflow-hidden">
                    <div
                      className={`w-full rounded-t-xl transition-all duration-500 ${
                        activeMetric === "completionRate" ? "bg-primary" : "bg-sec"
                      }`}
                      style={{ height: `${Math.max(8, pt.value)}%` }}
                    />
                  </div>
                  <div className="text-xs font-bold text-ink-normal/70 rotate-45 sm:rotate-0 mt-2 whitespace-nowrap">
                    {toPersianDigits(pt.dateJalali.slice(5))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between text-xs sm:text-sm text-ink-normal/60 pt-3 px-2 font-medium">
              <span>راهنما: با نگه داشتن ماوس یا لمس هر ستون، درصد دقیق روز نمایش داده می‌شود.</span>
              <span className="font-bold text-sec">مجموع روزهای محاسبه‌شده: {toPersianDigits(trendData.length)} روز</span>
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
            <div className="p-5 rounded-2xl bg-gradient-to-r from-ecosystem-light via-white to-college-light border border-primary/20 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-sec">{employeeHistory.employee.fullName}</h3>
                <div className="text-xs sm:text-sm text-ink-normal/60 mt-0.5 font-medium">
                  {employeeHistory.employee.department || "پسرانه"} • {employeeHistory.employee.position || "همکار"}
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-2xl border border-college-normal/30 shadow-sm">
                <Flame className="w-6 h-6 text-college-normal animate-pulse" />
                <div className="text-right">
                  <div className="text-sm font-black text-college-darker">
                    {toPersianDigits(employeeHistory.summary.streak)} روز متوالی
                  </div>
                  <div className="text-xs text-ink-normal/60 font-medium">ثبت بدون وقفه (Streak)</div>
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-gray-50 rounded-2xl border">
                <div className="text-xs sm:text-sm text-ink-normal/60 font-medium">تعداد کل گزارش‌ها</div>
                <div className="text-xl font-black text-sec mt-1">
                  {toPersianDigits(employeeHistory.summary.totalSubmitted)}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-2xl border">
                <div className="text-xs sm:text-sm text-ink-normal/60 font-medium">درصد به‌موقع بودن</div>
                <div className="text-xl font-black text-primary mt-1">
                  ٪{toPersianDigits(employeeHistory.summary.onTimeRate)}
                </div>
              </div>
            </div>

            {/* Recent Reports List */}
            <div>
              <h4 className="text-sm font-black text-sec mb-3">گزارش‌های ارسالی اخیر:</h4>
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {employeeHistory.reports.length === 0 ? (
                  <div className="text-center py-6 text-sm text-gray-400">گزارشی در این بازه ثبت نشده است.</div>
                ) : (
                  employeeHistory.reports.map((rep: any) => (
                    <div key={rep.id} className="p-4 bg-white rounded-2xl border border-gray-200 text-xs sm:text-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sec">{rep.reportDateJalali}</span>
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                            rep.status === "on_time"
                              ? "bg-ecosystem-light text-ecosystem-darker"
                              : "bg-female-light text-female-darker"
                          }`}
                        >
                          {rep.status === "on_time" ? "به‌موقع" : "با تأخیر"}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-ink-normal/80 line-clamp-2 leading-relaxed">
                        {rep.rawText.replace(/^\/report\s*/i, "").trim()}
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
  );
}
