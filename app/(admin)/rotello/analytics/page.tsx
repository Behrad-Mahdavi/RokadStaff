"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Users,
  Flame,
  Kanban,
  Sparkles,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import { toPersianDigits } from "@/lib/utils";

export default function RotelloAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rotello/dashboard/summary");
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
    fetchSummary();
  }, []);

  const summary = data?.summary || {
    totalOpen: 0,
    totalCompleted: 0,
    overdueCount: 0,
    avgCycleDays: 0,
  };

  const openByPriority = data?.openByPriority || { urgent: 0, important: 0, normal: 0 };
  const workload = data?.workload || [];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-ecosystem-light via-white to-club-light/40 dark:from-[#151C28] dark:via-[#161E2C] dark:to-[#151C28] p-6 sm:p-7 rounded-2xl border-2 border-primary/20 dark:border-gray-800 shadow-[3px_3px_0_#59BBAF]">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-primary mb-1.5">
            <Layers className="w-4 h-4" />
            <span>داشبورد نظارتی و شاخص‌های سلامت پروژه‌ها</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-sec dark:text-white tracking-tight">داشبورد مانیتورینگ</h1>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="وظایف باز در دست اقدام"
          value={`${toPersianDigits(summary.totalOpen)} وظیفه`}
          subtitle="در تمام پروژه‌های فعال سازمان"
          icon={Kanban}
          theme="ecosystem"
        />

        <StatCard
          title="وظایف عقب‌افتاده"
          value={`${toPersianDigits(summary.overdueCount)} وظیفه`}
          subtitle="نیازمند پیگیری و اقدام فوری"
          icon={AlertCircle}
          theme="college"
        />

        <StatCard
          title="کل وظایف تکمیل‌شده"
          value={`${toPersianDigits(summary.totalCompleted)} وظیفه`}
          subtitle="تکمیل موفقیت‌آمیز در ستون نهایی"
          icon={CheckCircle2}
          theme="club"
        />

        <StatCard
          title="میانگین چرخه تکمیل کارها"
          value={`${toPersianDigits(summary.avgCycleDays)} روز`}
          subtitle="از زمان ایجاد تا رسیدن به مرحله تکمیل"
          icon={Clock}
          theme="male"
        />
      </div>

      {/* Two Columns Grid: Priority Breakdown & Team Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown Card */}
        <div className="bg-white dark:bg-[#151C28] rounded-2xl p-6 sm:p-7 border border-[#EAEAEA] dark:border-gray-800 shadow-[3px_3px_0_#202A5A] dark:shadow-[3px_3px_0_#59BBAF] space-y-5">
          <div>
            <h2 className="text-base sm:text-lg font-black text-sec dark:text-white">توزیع وظایف باز بر اساس اولویت</h2>
            <p className="text-xs sm:text-sm text-ink-normal/60 dark:text-gray-400 mt-0.5 font-medium">
              تفکیک وظایف فعال بر اساس درجه حساسیت
            </p>
          </div>

          <div className="space-y-4">
            {/* Urgent */}
            <div className="p-4 bg-female-light/40 dark:bg-female-darker/30 rounded-xl border border-female-normal/20 dark:border-female-normal/30 space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm font-black">
                <span className="text-female-darker dark:text-female-light flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-female-normal" />
                  <span>فوری</span>
                </span>
                <span className="text-female-darker dark:text-female-light">
                  {toPersianDigits(openByPriority.urgent)} وظیفه
                </span>
              </div>
              <div className="w-full h-2.5 bg-female-light dark:bg-female-darker/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-female-normal rounded-full"
                  style={{
                    width: `${summary.totalOpen > 0 ? (openByPriority.urgent / summary.totalOpen) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Important */}
            <div className="p-4 bg-college-light/40 dark:bg-college-darker/30 rounded-xl border border-college-normal/20 dark:border-college-normal/30 space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm font-black">
                <span className="text-college-darker dark:text-college-light flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-college-normal" />
                  <span>مهم</span>
                </span>
                <span className="text-college-darker dark:text-college-light">
                  {toPersianDigits(openByPriority.important)} وظیفه
                </span>
              </div>
              <div className="w-full h-2.5 bg-college-light dark:bg-college-darker/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-college-normal rounded-full"
                  style={{
                    width: `${summary.totalOpen > 0 ? (openByPriority.important / summary.totalOpen) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Normal */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm font-black">
                <span className="text-ink-normal/70 dark:text-gray-300 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  <span>عادی</span>
                </span>
                <span className="text-sec dark:text-white">{toPersianDigits(openByPriority.normal)} وظیفه</span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{
                    width: `${summary.totalOpen > 0 ? (openByPriority.normal / summary.totalOpen) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Team Workload Distribution Card */}
        <div className="bg-white dark:bg-[#151C28] rounded-2xl p-6 sm:p-7 border border-[#EAEAEA] dark:border-gray-800 shadow-[3px_3px_0_#202A5A] dark:shadow-[3px_3px_0_#59BBAF] space-y-5">
          <div>
            <h2 className="text-base sm:text-lg font-black text-sec dark:text-white">توزیع بار کاری همکاران</h2>
            <p className="text-xs sm:text-sm text-ink-normal/60 dark:text-gray-400 mt-0.5 font-medium">
              تعداد وظایف باز واگذارشده به هر همکار
            </p>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {workload.length === 0 ? (
              <div className="text-center py-10 text-xs sm:text-sm text-gray-400">
                هیچ وظیفه واگذارشده‌ای یافت نشد.
              </div>
            ) : (
              workload.map((staff: any) => {
                const percent = summary.totalOpen > 0 ? Math.round((staff.count / summary.totalOpen) * 100) : 0;

                return (
                  <div
                    key={staff.employeeId}
                    className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs sm:text-sm font-black">
                      <span className="text-sec dark:text-white">
                        {staff.fullName} ({staff.department})
                      </span>
                      <span className="text-primary">
                        {toPersianDigits(staff.count)} وظیفه باز (٪{toPersianDigits(percent)})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
