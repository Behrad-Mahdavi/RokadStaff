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
} from "lucide-react";
import Link from "next/link";
import PersianDatePicker from "@/components/PersianDatePicker";
import { formatToJalali, formatTehranTime, toPersianDigits } from "@/lib/utils";

export default function UnifiedEmployeeReportPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"snapshot" | "rotello" | "daily">("snapshot");

  // Date filters (Default to last 30 days)
  const defaultTo = new Date().toISOString().split("T")[0];
  const defaultFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

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

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto font-vazirmatn space-y-6">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/reports/employee"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-ink-normal/60 hover:text-primary transition"
        >
          <ArrowRight className="w-4 h-4" />
          <span>بازگشت به لیست همکاران</span>
        </Link>

        <button
          onClick={handleExportExcel}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-green text-white text-xs sm:text-sm font-black shadow-sm hover:opacity-95 transition"
        >
          <Download className="w-4 h-4" />
          <span>خروجی اکسل چند شیت</span>
        </button>
      </div>

      {/* Employee Profile Header & Date Range */}
      <div className="p-6 bg-white rounded-3xl border border-gray-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-ecosystem-dark text-white flex items-center justify-center font-black text-2xl shadow-[3px_3px_0_#202A5A] shrink-0">
            {data?.employee?.fullName ? data.employee.fullName.slice(0, 1) : "ک"}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-sec">
                {data?.employee?.fullName || "در حال دریافت..."}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-ecosystem-light text-ecosystem-darker border border-primary/20">
                {data?.employee?.role === "admin"
                  ? "مدیر کل"
                  : data?.employee?.role === "supervisor"
                  ? "سرپرست"
                  : "همکار"}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-ink-normal/60 mt-1 font-medium">
              {data?.employee?.position || "همکار"} • دپارتمان {data?.employee?.department || "پسرانه"}
            </p>
          </div>
        </div>

        {/* Jalali Date Filter */}
        <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink-normal/60">از تاریخ:</span>
            <div className="w-40">
              <PersianDatePicker
                value={fromDate}
                onChange={(val) => setFromDate(val || defaultFrom)}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-ink-normal/60">تا تاریخ:</span>
            <div className="w-40">
              <PersianDatePicker
                value={toDate}
                onChange={(val) => setToDate(val || defaultTo)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("snapshot")}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-black border-b-2 transition-all ${
            activeTab === "snapshot"
              ? "border-primary text-primary bg-primary/5 rounded-t-xl"
              : "border-transparent text-ink-normal/60 hover:text-sec"
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>وضعیت لحظه‌ای تسک‌ها (Snapshot)</span>
        </button>

        <button
          onClick={() => setActiveTab("rotello")}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-black border-b-2 transition-all ${
            activeTab === "rotello"
              ? "border-primary text-primary bg-primary/5 rounded-t-xl"
              : "border-transparent text-ink-normal/60 hover:text-sec"
          }`}
        >
          <FolderKanban className="w-4 h-4" />
          <span>فعالیت پروژه‌ها و تسک‌ها (Rotello)</span>
        </button>

        <button
          onClick={() => setActiveTab("daily")}
          className={`flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-black border-b-2 transition-all ${
            activeTab === "daily"
              ? "border-primary text-primary bg-primary/5 rounded-t-xl"
              : "border-transparent text-ink-normal/60 hover:text-sec"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>گزارش‌های روزانه تلگرام (Rokad)</span>
        </button>
      </div>

      {/* Tab Contents */}
      {loading ? (
        <div className="p-16 text-center text-xs text-gray-400 font-bold">
          در حال پردازش داده‌های یکپارچه همکار...
        </div>
      ) : !data ? (
        <div className="p-12 bg-white rounded-3xl border border-gray-200 text-center text-xs text-gray-400">
          اطلاعاتی یافت نشد.
        </div>
      ) : (
        <>
          {/* TAB 1: Current Tasks Snapshot */}
          {activeTab === "snapshot" && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-white rounded-3xl border border-gray-200 shadow-sm">
                  <div className="text-xs text-ink-normal/60 font-bold mb-1">کل تسک‌های باز</div>
                  <div className="text-2xl font-black text-sec">
                    {toPersianDigits(data.currentTasksSnapshot.totalOpen)}
                  </div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-college-normal/30 bg-college-light/30 shadow-sm">
                  <div className="text-xs text-college-darker font-bold mb-1">تسک‌های فوری (Urgent)</div>
                  <div className="text-2xl font-black text-college-normal">
                    {toPersianDigits(data.currentTasksSnapshot.priorityBreakdown.urgent)}
                  </div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-female-normal/30 bg-female-light/30 shadow-sm">
                  <div className="text-xs text-female-darker font-bold mb-1">تسک‌های مهم (Important)</div>
                  <div className="text-2xl font-black text-female-normal">
                    {toPersianDigits(data.currentTasksSnapshot.priorityBreakdown.important)}
                  </div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-red-200 bg-red-50/40 shadow-sm">
                  <div className="text-xs text-red-600 font-bold mb-1">عقب‌افتاده از ددلاین</div>
                  <div className="text-2xl font-black text-red-600">
                    {toPersianDigits(data.currentTasksSnapshot.overdueCount)}
                  </div>
                </div>
              </div>

              {/* Open Tasks List */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
                <h3 className="text-base font-black text-sec flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  <span>لیست تسک‌های در دست اقدام این همکار ({toPersianDigits(data.currentTasksSnapshot.openTasks.length)})</span>
                </h3>

                {data.currentTasksSnapshot.openTasks.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-4">در حال حاضر هیچ تسک بازی به این همکار منتسب نشده است.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {data.currentTasksSnapshot.openTasks.map((task: any) => (
                      <div key={task.id} className="py-3.5 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-sec">{task.title}</span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                task.priority === "urgent"
                                  ? "bg-college-light text-college-darker"
                                  : task.priority === "important"
                                  ? "bg-female-light text-female-darker"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {task.priority === "urgent"
                                ? "فوری"
                                : task.priority === "important"
                                ? "مهم"
                                : "عادی"}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-ink-normal/50 mt-1">
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
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            ددلاین: {formatToJalali(task.deadline)} {task.isOverdue && "(معوقه)"}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Rotello Activity in Date Range */}
          {activeTab === "rotello" && (
            <div className="space-y-6">
              {/* Activity Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-white rounded-3xl border border-gray-200 shadow-sm">
                  <div className="text-xs text-ink-normal/60 font-bold mb-1">تسک‌های تکمیل‌شده در بازه</div>
                  <div className="text-2xl font-black text-accent-green">
                    {toPersianDigits(data.rotelloActivity.completedTasksCount)}
                  </div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-gray-200 shadow-sm">
                  <div className="text-xs text-ink-normal/60 font-bold mb-1">گزارش‌های عملکرد ثبت‌شده</div>
                  <div className="text-2xl font-black text-primary">
                    {toPersianDigits(data.rotelloActivity.taskReportsCount)}
                  </div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-gray-200 shadow-sm">
                  <div className="text-xs text-ink-normal/60 font-bold mb-1">تیک‌های چک‌لیست زده‌شده</div>
                  <div className="text-2xl font-black text-sec">
                    {toPersianDigits(data.rotelloActivity.checklistDoneCount)}
                  </div>
                </div>
              </div>

              {/* Completed Tasks List */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
                <h3 className="text-base font-black text-sec flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-accent-green" />
                  <span>تسک‌های تکمیل‌شده در این بازه ({toPersianDigits(data.rotelloActivity.completedTasks.length)})</span>
                </h3>

                {data.rotelloActivity.completedTasks.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-4">تسکی در این بازه زمانی به وضعیت نهایی نرسیده است.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {data.rotelloActivity.completedTasks.map((t: any) => (
                      <div key={t.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="text-sm font-bold text-sec">{t.title}</div>
                          <div className="text-xs text-ink-normal/50 mt-0.5">{t.projectName || "تسک فردی"}</div>
                        </div>
                        <div className="text-xs font-bold text-gray-500">
                          {t.completedAt ? formatToJalali(t.completedAt) : "-"}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Task Narrative Reports Timeline */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
                <h3 className="text-base font-black text-sec flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  <span>گزارش‌های روایی عملکرد تسک‌ها ({toPersianDigits(data.rotelloActivity.taskReports.length)})</span>
                </h3>

                {data.rotelloActivity.taskReports.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-4">هیچ گزارش متنی عملکردی در این بازه ثبت نشده است.</p>
                ) : (
                  <div className="space-y-3">
                    {data.rotelloActivity.taskReports.map((r: any) => (
                      <div key={r.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-ink-normal/60">
                          <span>تسک: {r.taskTitle} ({r.projectName || "تسک فردی"})</span>
                          <span>{formatToJalali(r.createdAt)} - ساعت {formatTehranTime(r.createdAt)}</span>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-sec leading-relaxed whitespace-pre-wrap">
                          {r.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Daily Reports Activity (Rokad Staff) */}
          {activeTab === "daily" && (
            <div className="space-y-6">
              {/* KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 bg-white rounded-3xl border border-gray-200 shadow-sm">
                  <div className="text-xs text-ink-normal/60 font-bold mb-1">کل گزارش‌های ثبت‌شده</div>
                  <div className="text-2xl font-black text-sec">
                    {toPersianDigits(data.dailyReportsActivity.totalSubmitted)}
                  </div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-gray-200 shadow-sm">
                  <div className="text-xs text-ink-normal/60 font-bold mb-1">درصد ارسال به‌موقع</div>
                  <div className="text-2xl font-black text-accent-green">
                    %{toPersianDigits(data.dailyReportsActivity.onTimeRate)}
                  </div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-gray-200 shadow-sm">
                  <div className="text-xs text-ink-normal/60 font-bold mb-1">گزارش‌های با تأخیر</div>
                  <div className="text-2xl font-black text-college-normal">
                    {toPersianDigits(data.dailyReportsActivity.lateCount)}
                  </div>
                </div>

                <div className="p-5 bg-white rounded-3xl border border-red-200 bg-red-50/40 shadow-sm">
                  <div className="text-xs text-red-600 font-bold mb-1">روزهای بدون گزارش (غیبت)</div>
                  <div className="text-2xl font-black text-red-600">
                    {toPersianDigits(data.dailyReportsActivity.missingDatesCount)} روز
                  </div>
                </div>
              </div>

              {/* Missing Dates Alert */}
              {data.dailyReportsActivity.missingDates.length > 0 && (
                <div className="p-4 bg-red-50 rounded-2xl border border-red-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-red-800">
                      روزهای کاری بدون ثبت گزارش در این بازه:
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {data.dailyReportsActivity.missingDates.map((d: string) => (
                        <span
                          key={d}
                          className="px-2.5 py-1 rounded-lg bg-white border border-red-200 text-[11px] font-bold text-red-700 shadow-xs"
                        >
                          {formatToJalali(d)}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Daily Reports List */}
              <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm space-y-4">
                <h3 className="text-base font-black text-sec flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  <span>گزارش‌های روزانه ثبت‌شده ({toPersianDigits(data.dailyReportsActivity.reports.length)})</span>
                </h3>

                {data.dailyReportsActivity.reports.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-4">گزارش روزانه‌ای در این بازه ثبت نشده است.</p>
                ) : (
                  <div className="space-y-4">
                    {data.dailyReportsActivity.reports.map((rep: any) => (
                      <div key={rep.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span className="text-sec font-black">{formatToJalali(rep.reportDate)}</span>
                          <div className="flex items-center gap-2">
                            <span>ساعت {formatTehranTime(rep.submittedAt)}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] ${
                                rep.isOnTime
                                  ? "bg-accent-green/20 text-accent-green"
                                  : "bg-college-light text-college-darker"
                              }`}
                            >
                              {rep.isOnTime ? "به‌موقع" : "با تأخیر"}
                            </span>
                          </div>
                        </div>

                        {/* Report Items */}
                        {rep.items && rep.items.length > 0 ? (
                          <div className="space-y-1.5 pt-2 border-t border-gray-200/60">
                            {rep.items.map((it: any) => (
                              <div key={it.id} className="flex items-start gap-2 text-xs text-ink-dark">
                                <span className="font-bold text-primary">{toPersianDigits(it.taskOrder)}.</span>
                                <span className="font-medium leading-relaxed">{it.description}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-ink-normal leading-relaxed whitespace-pre-wrap">
                            {rep.rawText.replace(/^\/report\s*/i, "").trim()}
                          </p>
                        )}
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
  );
}
