"use client";

import React, { useEffect, useState } from "react";
import StatCard from "@/components/StatCard";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  TrendingUp,
  FileText,
  UserPlus,
  Send,
  Sparkles,
  ChevronLeft,
  Calendar,
  Check,
  X,
  Hourglass,
} from "lucide-react";
import Link from "next/link";
import { formatToJalali, formatTehranTime, toPersianDigits } from "@/lib/utils";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cronTriggering, setCronTriggering] = useState(false);
  const [cronResult, setCronResult] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dashboard/summary");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTestCron = async () => {
    setCronTriggering(true);
    setCronResult(null);
    try {
      const res = await fetch("/api/cron/reminder", { method: "POST" });
      const result = await res.json();
      if (res.ok) {
        setCronResult(`ارسال شد: ${result.sentCount} پیام به افراد غایب`);
      } else {
        setCronResult(`خطا: ${result.error}`);
      }
    } catch (err: any) {
      setCronResult("خطا در ارسال درخواست کران");
    } finally {
      setCronTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border animate-pulse p-4" />
          ))}
        </div>
      </div>
    );
  }

  const overview = data?.overview || {
    totalStaff: 0,
    activeStaff: 0,
    linkedStaff: 0,
    todaySubmitted: 0,
    todayMissing: 0,
    todayOnTime: 0,
    todayLate: 0,
    participationRate: 0,
  };

  const tasks = data?.tasks || {
    total: 0,
    done: 0,
    incomplete: 0,
    cancelled: 0,
    completionRate: 0,
  };

  const departments = data?.departments || {};
  const recentReports = data?.recentReports || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-ecosystem-light via-white to-college-light/40 p-6 rounded-3xl border-2 border-primary/20 shadow-[3px_3px_0_#59BBAF]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-primary mb-1">
            <Sparkles className="w-4 h-4" />
            <span>گزارش جامع عملکرد امروز</span>
          </div>
          <h1 className="text-2xl font-black text-sec">داشبورد مدیریت رُکاد‌استاف</h1>
          <p className="text-xs text-ink-normal/60 mt-1">
            وضعیت دریافت و پردازش چک‌لیست‌های پایان روز کارکنان در تاریخ {formatToJalali(new Date())}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/employees"
            className="rokad-btn-primary px-4 py-2.5 text-xs rounded-xl"
          >
            <UserPlus className="w-4 h-4" />
            <span>ثبت کارمند جدید</span>
          </Link>
          <button
            onClick={handleTestCron}
            disabled={cronTriggering}
            className="rokad-btn-outline px-4 py-2.5 text-xs rounded-xl"
          >
            <Send className="w-4 h-4 text-college-normal" />
            <span>{cronTriggering ? "در حال ارسال..." : "ارسال یادآوری فوری"}</span>
          </button>
        </div>
      </div>

      {cronResult && (
        <div className="p-4 rounded-xl bg-college-light border border-college-normal/40 text-xs font-bold text-college-darker flex items-center justify-between">
          <span>🔔 نتیجه عملیات یادآوری: {cronResult}</span>
          <button onClick={() => setCronResult(null)} className="text-xs underline">بستن</button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="نرخ مشارکت امروز"
          value={`٪${toPersianDigits(overview.participationRate)}`}
          subtitle={`${toPersianDigits(overview.todaySubmitted)} از ${toPersianDigits(overview.activeStaff)} نفر گزارش داده‌اند`}
          icon={TrendingUp}
          theme="ecosystem"
          trend={{
            value: overview.participationRate >= 70 ? "عالی" : "نیاز به پیگیری",
            isPositive: overview.participationRate >= 70,
          }}
        />

        <StatCard
          title="گزارش‌های به‌موقع / با تأخیر"
          value={`${toPersianDigits(overview.todayOnTime)} / ${toPersianDigits(overview.todayLate)}`}
          subtitle="تفکیک بر اساس ساعت پایان کار (۱۸:۰۰)"
          icon={Clock}
          theme="male"
        />

        <StatCard
          title="نرخ تکمیل تسک‌های امروز"
          value={`٪${toPersianDigits(tasks.completionRate)}`}
          subtitle={`${toPersianDigits(tasks.done)} تسک از ${toPersianDigits(tasks.total)} تسک انجام شد`}
          icon={CheckCircle2}
          theme="college"
        />

        <StatCard
          title="کل کارکنان / متصل به تلگرام"
          value={`${toPersianDigits(overview.activeStaff)} / ${toPersianDigits(overview.linkedStaff)}`}
          subtitle={`${toPersianDigits(overview.activeStaff - overview.linkedStaff)} نفر منتظر اتصال هستند`}
          icon={Users}
          theme="club"
        />
      </div>

      {/* Two Column Layout: Tasks & Departments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Breakdown Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A] lg:col-span-1">
          <h2 className="text-base font-extrabold text-sec mb-4 flex items-center justify-between">
            <span>تفکیک تسک‌های امروز</span>
            <span className="text-xs text-ink-normal/50 font-normal">
              مجموع: {toPersianDigits(tasks.total)} تسک
            </span>
          </h2>

          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-ecosystem-light/80 border border-primary/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-primary text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-sec">انجام شد</div>
                  <div className="text-[11px] text-ink-normal/60">تکمیل کامل وظیفه</div>
                </div>
              </div>
              <div className="text-lg font-black text-primary">{toPersianDigits(tasks.done)}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-college-light/80 border border-college-normal/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-college-normal text-white flex items-center justify-center">
                  <Hourglass className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-sec">ناقص مانده</div>
                  <div className="text-[11px] text-ink-normal/60">نیازمند ادامه در روز بعد</div>
                </div>
              </div>
              <div className="text-lg font-black text-college-normal">{toPersianDigits(tasks.incomplete)}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-female-light/80 border border-female-normal/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-female-normal text-white flex items-center justify-center">
                  <X className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-sec">لغو شد</div>
                  <div className="text-[11px] text-ink-normal/60">تسک منتفی شده</div>
                </div>
              </div>
              <div className="text-lg font-black text-female-normal">{toPersianDigits(tasks.cancelled)}</div>
            </div>
          </div>
        </div>

        {/* Department Participation Card */}
        <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A] lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold text-sec">مشارکت به تفکیک دپارتمان</h2>
            <Link
              href="/reports"
              className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
            >
              <span>مشاهده همه گزارش‌ها</span>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {Object.keys(departments).length === 0 ? (
              <div className="text-center py-8 text-xs text-ink-normal/50">داده‌ای یافت نشد.</div>
            ) : (
              Object.entries(departments).map(([dept, info]: any) => {
                const percent = info.total > 0 ? Math.round((info.submitted / info.total) * 100) : 0;
                return (
                  <div key={dept} className="p-3 rounded-xl border border-gray-100 hover:border-primary/40 transition-colors">
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <span className="text-sec">{dept}</span>
                      <span className="text-ink-normal/60">
                        {toPersianDigits(info.submitted)} از {toPersianDigits(info.total)} نفر (٪{toPersianDigits(percent)})
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-ecosystem-dark rounded-full transition-all duration-500"
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

      {/* Recent Submitted Reports Feed */}
      <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A]">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-extrabold text-sec">آخرین گزارش‌های دریافتی امروز</h2>
            <p className="text-xs text-ink-normal/50 mt-0.5">دریافت مستقیم و زنده از ربات تلگرام</p>
          </div>
          <Link
            href="/reports"
            className="rokad-btn-outline px-3.5 py-1.5 text-xs rounded-xl font-bold"
          >
            مشاهده کامل گزارش‌ها
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <div className="text-sm font-bold text-ink-normal/70">هنوز گزارشی برای امروز ثبت نشده است.</div>
            <div className="text-xs text-ink-normal/50 mt-1">کارمندان می‌توانند با ارسال دستور /report به ربات تلگرام گزارش خود را بفرستند.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentReports.map((report: any) => (
              <div
                key={report.id}
                className="p-4 rounded-xl border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-200 flex flex-col justify-between bg-[#FCFDFD]"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-extrabold text-sm text-sec">{report.employeeFullName}</span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        report.status === "on_time"
                          ? "bg-ecosystem-light text-ecosystem-darker border-primary/30"
                          : "bg-female-light text-female-darker border-female-normal/30"
                      }`}
                    >
                      {report.status === "on_time" ? "به‌موقع" : "با تأخیر"}
                    </span>
                  </div>
                  <div className="text-xs text-ink-normal/60 mb-3">
                    {report.employeeDepartment || "عمومی"}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-ink-normal/50">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>ساعت ارسال: {formatTehranTime(report.submittedAt)}</span>
                  </div>
                  {report.editedCount > 0 && (
                    <span className="text-[10px] bg-gray-100 text-ink-normal/70 px-1.5 py-0.5 rounded">
                      {toPersianDigits(report.editedCount)} بار ویرایش
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
