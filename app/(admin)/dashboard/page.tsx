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
        <div className="h-10 w-56 bg-gray-200 animate-pulse rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-white rounded-2xl border animate-pulse p-5" />
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

  const departments = data?.departments || {};
  const recentReports = data?.recentReports || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-ecosystem-light via-white to-college-light/40 p-6 sm:p-7 rounded-3xl border-2 border-primary/20 shadow-[3px_3px_0_#59BBAF]">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-primary mb-1.5">
            <Sparkles className="w-4 h-4" />
            <span>گزارش جامع عملکرد امروز</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-sec tracking-tight">داشبورد مدیریت رُکاد‌استاف</h1>
          <p className="text-sm text-ink-normal/70 mt-1 font-medium">
            وضعیت دریافت گزارش کار پایان روز کارکنان در تاریخ {formatToJalali(new Date())}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/employees"
            className="rokad-btn-primary px-4 sm:px-5 py-3 text-sm rounded-xl font-bold"
          >
            <UserPlus className="w-4 h-4" />
            <span>ثبت کارمند جدید</span>
          </Link>
          <button
            onClick={handleTestCron}
            disabled={cronTriggering}
            className="rokad-btn-outline px-4 sm:px-5 py-3 text-sm rounded-xl font-bold"
          >
            <Send className="w-4 h-4 text-college-normal" />
            <span>{cronTriggering ? "در حال ارسال..." : "ارسال یادآوری به غایبان"}</span>
          </button>
        </div>
      </div>

      {cronResult && (
        <div className="p-4 sm:p-5 rounded-2xl bg-college-light border border-college-normal/40 text-sm font-bold text-college-darker flex items-center justify-between shadow-sm">
          <span>🔔 نتیجه عملیات یادآوری: {cronResult}</span>
          <button onClick={() => setCronResult(null)} className="text-xs sm:text-sm underline font-black">بستن</button>
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
          title="غایبان در ثبت گزارش امروز"
          value={`${toPersianDigits(overview.todayMissing)} نفر`}
          subtitle="کارمندان فعالی که هنوز ثبت نکرده‌اند"
          icon={AlertCircle}
          theme="college"
        />

        <StatCard
          title="کل کارکنان / متصل به تلگرام"
          value={`${toPersianDigits(overview.activeStaff)} / ${toPersianDigits(overview.linkedStaff)}`}
          subtitle={`${toPersianDigits(overview.activeStaff - overview.linkedStaff)} نفر در انتظار اتصال`}
          icon={Users}
          theme="club"
        />
      </div>

      {/* Department Participation Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-sec">مشارکت ثبت گزارش به تفکیک دپارتمان</h2>
          <Link
            href="/reports"
            className="text-sm font-bold text-primary hover:underline flex items-center gap-1"
          >
            <span>مشاهده همه گزارش‌ها</span>
            <ChevronLeft className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.keys(departments).length === 0 ? (
            <div className="text-center py-10 text-sm text-ink-normal/50 col-span-2">داده‌ای یافت نشد.</div>
          ) : (
            Object.entries(departments).map(([dept, info]: any) => {
              const percent = info.total > 0 ? Math.round((info.submitted / info.total) * 100) : 0;
              return (
                <div key={dept} className="p-5 rounded-2xl border border-gray-100 hover:border-primary/40 transition-colors bg-[#FCFDFD]">
                  <div className="flex items-center justify-between text-sm font-bold mb-3">
                    <span className="text-sec font-black text-base">{dept}</span>
                    <span className="text-ink-normal/70">
                      {toPersianDigits(info.submitted)} از {toPersianDigits(info.total)} نفر (٪{toPersianDigits(percent)})
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden">
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

      {/* Recent Submitted Reports Feed */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-black text-sec">آخرین گزارش‌های دریافتی امروز</h2>
            <p className="text-xs sm:text-sm text-ink-normal/60 mt-0.5">دریافت مستقیم و زنده از ربات تلگرام</p>
          </div>
          <Link
            href="/reports"
            className="rokad-btn-outline px-4 py-2 text-xs sm:text-sm rounded-xl font-bold"
          >
            مشاهده کامل گزارش‌ها
          </Link>
        </div>

        {recentReports.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <div className="text-base font-bold text-ink-normal/80">هنوز گزارشی برای امروز ثبت نشده است.</div>
            <div className="text-xs sm:text-sm text-ink-normal/50 mt-1">کارمندان می‌توانند با ارسال دستور /report به ربات تلگرام گزارش خود را بفرستند.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentReports.map((report: any) => {
              const cleanText = report.rawText.replace(/^\/report\s*/i, "").trim();
              return (
                <div
                  key={report.id}
                  className="p-5 rounded-2xl border border-gray-200 hover:border-primary hover:shadow-md transition-all duration-200 flex flex-col justify-between bg-[#FCFDFD]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="font-black text-base text-sec">{report.employeeFullName}</span>
                      <span
                        className={`text-xs font-black px-3 py-1 rounded-full border ${
                          report.status === "on_time"
                            ? "bg-ecosystem-light text-ecosystem-darker border-primary/30"
                            : "bg-female-light text-female-darker border-female-normal/30"
                        }`}
                      >
                        {report.status === "on_time" ? "به‌موقع" : "با تأخیر"}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-ink-normal/60 mb-3 font-medium">
                      دپارتمان: {report.employeeDepartment || "پسرانه"}
                    </div>
                    <p className="text-xs sm:text-sm text-ink-normal/80 line-clamp-3 bg-white p-3 rounded-xl border border-gray-100 font-medium leading-relaxed">
                      {cleanText}
                    </p>
                  </div>

                  <div className="pt-3.5 mt-3 border-t border-gray-100 flex items-center justify-between text-xs text-ink-normal/60 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      <span>ساعت ثبت: {formatTehranTime(report.submittedAt)}</span>
                    </div>
                    {report.editedCount > 0 && (
                      <span className="text-xs bg-gray-100 text-ink-normal/80 px-2 py-0.5 rounded-md font-bold">
                        {toPersianDigits(report.editedCount)} بار ویرایش
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
