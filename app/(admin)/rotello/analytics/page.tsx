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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-ecosystem-light via-white to-club-light/40 p-6 sm:p-7 rounded-3xl border-2 border-primary/20 shadow-[3px_3px_0_#59BBAF]">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-primary mb-1.5">
            <Layers className="w-4 h-4" />
            <span>داشبورد نظارتی و شاخص‌های سلامت پروژه‌ها</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-sec tracking-tight">آنالیتیکس پروژه‌های Rotello</h1>
          <p className="text-xs sm:text-sm text-ink-normal/70 mt-1 font-medium">
            پایش بار کاری تیم، تسک‌های در گردش و سرعت تکمیل پروژه‌ها
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="تسک‌های باز در دست اقدام"
          value={`${toPersianDigits(summary.totalOpen)} تسک`}
          subtitle="در تمام پروژه‌های فعال سازمان"
          icon={Kanban}
          theme="ecosystem"
        />

        <StatCard
          title="تسک‌های عقب‌افتاده (Overdue)"
          value={`${toPersianDigits(summary.overdueCount)} تسک`}
          subtitle="نیازمند پیگیری و اقدام فوری"
          icon={AlertCircle}
          theme="college"
        />

        <StatCard
          title="کل تسک‌های تکمیل‌شده"
          value={`${toPersianDigits(summary.totalCompleted)} تسک`}
          subtitle="تکمیل موفقیت‌آمیز در ستون Done"
          icon={CheckCircle2}
          theme="club"
        />

        <StatCard
          title="میانگین زمان تکمیل (Cycle Time)"
          value={`${toPersianDigits(summary.avgCycleDays)} روز`}
          subtitle="از زمان ایجاد تا رسیدن به Done"
          icon={Clock}
          theme="male"
        />
      </div>

      {/* Two Columns Grid: Priority Breakdown & Team Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Breakdown Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A] space-y-5">
          <div>
            <h2 className="text-lg font-black text-sec">توزیع تسک‌های باز بر اساس اولویت</h2>
            <p className="text-xs sm:text-sm text-ink-normal/60 mt-0.5 font-medium">
              تفکیک وظایف فعال بر اساس درجه حساسیت
            </p>
          </div>

          <div className="space-y-4">
            {/* Urgent */}
            <div className="p-4 bg-female-light/40 rounded-2xl border border-female-normal/20 space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm font-black">
                <span className="text-female-darker flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-female-normal" />
                  <span>فوری (Urgent)</span>
                </span>
                <span className="text-female-darker">
                  {toPersianDigits(openByPriority.urgent)} تسک
                </span>
              </div>
              <div className="w-full h-2.5 bg-female-light rounded-full overflow-hidden">
                <div
                  className="h-full bg-female-normal rounded-full"
                  style={{
                    width: `${summary.totalOpen > 0 ? (openByPriority.urgent / summary.totalOpen) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Important */}
            <div className="p-4 bg-college-light/40 rounded-2xl border border-college-normal/20 space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm font-black">
                <span className="text-college-darker flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-college-normal" />
                  <span>مهم (Important)</span>
                </span>
                <span className="text-college-darker">
                  {toPersianDigits(openByPriority.important)} تسک
                </span>
              </div>
              <div className="w-full h-2.5 bg-college-light rounded-full overflow-hidden">
                <div
                  className="h-full bg-college-normal rounded-full"
                  style={{
                    width: `${summary.totalOpen > 0 ? (openByPriority.important / summary.totalOpen) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Normal */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
              <div className="flex items-center justify-between text-xs sm:text-sm font-black">
                <span className="text-ink-normal/70 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  <span>عادی (Normal)</span>
                </span>
                <span className="text-sec">{toPersianDigits(openByPriority.normal)} تسک</span>
              </div>
              <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
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
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A] space-y-5">
          <div>
            <h2 className="text-lg font-black text-sec">توزیع بار کاری تیم (Workload)</h2>
            <p className="text-xs sm:text-sm text-ink-normal/60 mt-0.5 font-medium">
              تعداد تسک‌های باز واگذارشده به هر همکار
            </p>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {workload.length === 0 ? (
              <div className="text-center py-10 text-xs sm:text-sm text-gray-400">
                هیچ تسک واگذارشده‌ای یافت نشد.
              </div>
            ) : (
              workload.map((staff: any) => {
                const percent = summary.totalOpen > 0 ? Math.round((staff.count / summary.totalOpen) * 100) : 0;

                return (
                  <div
                    key={staff.employeeId}
                    className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs sm:text-sm font-black">
                      <span className="text-sec">
                        {staff.fullName} ({staff.department})
                      </span>
                      <span className="text-primary">
                        {toPersianDigits(staff.count)} تسک باز (٪{toPersianDigits(percent)})
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
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
