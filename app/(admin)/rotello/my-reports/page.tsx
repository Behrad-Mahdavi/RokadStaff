"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Edit3,
  Search,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
  Check,
  X,
} from "lucide-react";
import Modal from "@/components/Modal";
import StatCard from "@/components/StatCard";
import {
  formatToJalali,
  formatTehranTime,
  getTehranDateString,
  toPersianDigits,
} from "@/lib/utils";

interface TaskItemInput {
  id: string;
  description: string;
  status: "done" | "incomplete" | "cancelled";
}

export default function MyDailyReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any[]>([]);
  const [todayReport, setTodayReport] = useState<any | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);

  // Modal submission state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // Form fields
  const [items, setItems] = useState<TaskItemInput[]>([
    { id: "1", description: "", status: "done" },
  ]);
  const [rawNotes, setRawNotes] = useState("");

  const todayStr = getTehranDateString();

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/reports?allDates=true");
      if (res.ok) {
        const data = await res.json();
        const list: any[] = data.reports || [];
        setReports(list);

        // Find today's report if any
        const today = list.find((r) => r.reportDate === todayStr);
        setTodayReport(today || null);

        // Pre-populate form if today already exists
        if (today) {
          if (today.items && today.items.length > 0) {
            setItems(
              today.items.map((it: any, idx: number) => ({
                id: it.id || String(idx + 1),
                description: it.description,
                status: it.status || "done",
              }))
            );
          }
          setRawNotes(today.rawText || "");
        }
      }
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: String(Date.now()), description: "", status: "done" },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, field: "description" | "status", value: string) => {
    setItems(
      items.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    const validItems = items.filter((it) => it.description.trim() !== "");
    if (validItems.length === 0 && !rawNotes.trim()) {
      setSubmitError("لطفاً حداقل یک وظیفه کاری یا متن گزارش را وارد کنید.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportDate: todayStr,
          rawText: rawNotes.trim(),
          items: validItems.map((it, idx) => ({
            description: it.description.trim(),
            status: it.status,
            taskOrder: idx + 1,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "خطا در ثبت گزارش");
      }

      setSubmitSuccess(data.message || "گزارش روزانه با موفقیت ثبت شد.");
      await fetchReports();
      setTimeout(() => {
        setIsSubmitModalOpen(false);
        setSubmitSuccess(null);
      }, 1200);
    } catch (err: any) {
      setSubmitError(err.message || "خطا در ارتباط با سرور");
    } finally {
      setSubmitting(false);
    }
  };

  // KPI Calculations
  const totalReportsCount = reports.length;
  const onTimeCount = reports.filter((r) => r.status === "on_time").length;
  const lateCount = reports.filter((r) => r.status === "late").length;
  const onTimeRate =
    totalReportsCount > 0
      ? Math.round((onTimeCount / totalReportsCount) * 100)
      : 100;

  const totalCompletedTasks = reports.reduce(
    (acc, r) => acc + (r.stats?.doneTasks || 0),
    0
  );

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      (r.rawText && r.rawText.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.items &&
        r.items.some((i: any) =>
          i.description.toLowerCase().includes(searchTerm.toLowerCase())
        ));
    const matchesStatus =
      filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-vazirmatn">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-ecosystem-light via-white to-male-light/40 dark:from-[#151C28] dark:via-[#161E2C] dark:to-[#151C28] p-6 rounded-2xl border-2 border-primary/20 dark:border-gray-800 shadow-[3px_3px_0_#59BBAF]">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-primary mb-1">
            <FileCheck2 className="w-4 h-4" />
            <span>سامانه ثبت و پیگیری گزارش‌های روزانه</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-sec dark:text-white tracking-tight">
            گزارش‌های روزانه من
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="rokad-btn-primary px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{todayReport ? "ویرایش گزارش امروز" : "ثبت گزارش روزانه امروز"}</span>
          </button>
        </div>
      </div>

      {/* Today's Status Card */}
      <div
        className={`p-5 rounded-2xl border transition-all ${
          todayReport
            ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60"
            : "bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/60"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                todayReport
                  ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300"
                  : "bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300"
              }`}
            >
              {todayReport ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-black text-sec dark:text-white">
                  وضعیت گزارش امروز (
                  {formatToJalali(todayStr, { showMonthName: true, includeDayName: true })}
                  )
                </span>
                {todayReport ? (
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-lg border ${
                      todayReport.status === "on_time"
                        ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/50 dark:text-emerald-200"
                        : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-200"
                    }`}
                  >
                    {todayReport.status === "on_time" ? "ارسال به‌موقع" : "ارسال با تاخیر"}
                  </span>
                ) : (
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 dark:bg-amber-900/50 dark:text-amber-200">
                    در انتظار ثبت
                  </span>
                )}
              </div>

              <p className="text-xs text-ink-normal/70 dark:text-gray-400 mt-1">
                {todayReport
                  ? `گزارش شما در ساعت ${formatTehranTime(todayReport.submittedAt)} ثبت شده و شامل ${toPersianDigits(todayReport.items?.length || 0)} مورد وظیفه کاری است.`
                  : "هنوز گزارش روزانه برای امروز ثبت نکرده‌اید. مهلت استاندارد ارسال تا پایان ساعت کاری می‌باشد."}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all shrink-0 ${
              todayReport
                ? "bg-white dark:bg-[#161D2A] border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/50"
                : "bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
            }`}
          >
            {todayReport ? "ویرایش و تکمیل مجدد" : "ثبت سریع گزارش امروز"}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <StatCard
          title="کل گزارش‌های ثبت‌شده"
          value={`${toPersianDigits(totalReportsCount)} روز`}
          subtitle="مجموع گزارش‌های ثبت‌شده در سامانه"
          icon={Calendar}
          theme="ecosystem"
        />

        <StatCard
          title="نرخ انضباط و تحویل به‌موقع"
          value={`٪${toPersianDigits(onTimeRate)}`}
          subtitle={`${toPersianDigits(onTimeCount)} روز ارسال در موعد مقرر`}
          icon={CheckCircle2}
          theme="club"
        />

        <StatCard
          title="گزارش‌های با تاخیر"
          value={`${toPersianDigits(lateCount)} روز`}
          subtitle="ثبت پس از پایان ساعت کاری"
          icon={Clock}
          theme="college"
        />

        <StatCard
          title="وظایف انجام‌شده گزارش‌شده"
          value={`${toPersianDigits(totalCompletedTasks)} وظیفه`}
          subtitle="فعالیت‌های کاری با موفقیت پایان‌یافته"
          icon={FileCheck2}
          theme="female"
        />
      </div>

      {/* Reports History & Filter Section */}
      <div className="bg-white dark:bg-[#151C28] rounded-2xl border border-[#EAEAEA] dark:border-gray-800 shadow-[2.5px_2.5px_0_#202A5A] dark:shadow-[2.5px_2.5px_0_#59BBAF] p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-black text-sec dark:text-white">
              تاریخچه گزارش‌های ارسالی من
            </h2>
            <p className="text-xs text-ink-normal/60 dark:text-gray-400 mt-0.5">
              آرشیو کامل فعالیت‌های روزانه ثبت‌شده به همراه وضعیت بررسی
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 sm:w-60">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="جستجو در گزارش‌ها..."
                className="w-full text-xs font-bold pr-9 pl-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121824] text-sec dark:text-white focus:border-primary focus:outline-none"
              />
            </div>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-xs font-bold p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121824] text-sec dark:text-white focus:border-primary focus:outline-none"
            >
              <option value="all">همه وضعیت‌ها</option>
              <option value="on_time">فقط به‌موقع</option>
              <option value="late">فقط با تاخیر</option>
            </select>
          </div>
        </div>

        {/* List of reports */}
        {loading ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400">
            در حال دریافت سوابق گزارش‌ها...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-12 text-center text-xs font-bold text-gray-400 bg-gray-50 dark:bg-[#121824] rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            هیچ گزارشی با این شرایط یافت نشد.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReports.map((rep) => {
              const isExpanded = expandedReportId === rep.id;
              const isOnTime = rep.status === "on_time";

              return (
                <div
                  key={rep.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700/80 bg-white dark:bg-[#121824] hover:border-primary/40 transition-all overflow-hidden"
                >
                  {/* Summary row */}
                  <div
                    onClick={() =>
                      setExpandedReportId(isExpanded ? null : rep.id)
                    }
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-[#161D2A] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isOnTime
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                        }`}
                      >
                        <FileCheck2 className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-sec dark:text-white">
                            گزارش {formatToJalali(rep.reportDate, { showMonthName: true, includeDayName: true })}
                          </span>
                          {rep.reportDate === todayStr && (
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-primary/15 text-primary">
                              امروز
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-ink-normal/60 dark:text-gray-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            ساعت ثبت: {formatTehranTime(rep.submittedAt)}
                          </span>
                          {rep.editedCount > 0 && (
                            <span className="text-primary font-bold">
                              ({toPersianDigits(rep.editedCount)} بار ویرایش‌شده)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
                            isOnTime
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                          }`}
                        >
                          {isOnTime ? "به‌موقع" : "با تاخیر"}
                        </span>

                        <span className="text-xs font-bold text-ink-normal/60 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
                          {toPersianDigits(rep.items?.length || 0)} مورد
                        </span>
                      </div>

                      <div className="text-gray-400">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="p-4 pt-2 border-t border-gray-100 dark:border-gray-800/80 bg-gray-50/50 dark:bg-[#151C28]/60 space-y-3">
                      {rep.items && rep.items.length > 0 ? (
                        <div className="space-y-2">
                          <span className="text-xs font-black text-ink-normal/70 dark:text-gray-300">
                            اقدامات و وظایف ثبت‌شده:
                          </span>
                          <div className="space-y-1.5">
                            {rep.items.map((it: any) => {
                              const isDone = it.status === "done";
                              const isIncomplete = it.status === "incomplete";

                              return (
                                <div
                                  key={it.id}
                                  className="p-2.5 rounded-lg bg-white dark:bg-[#121824] border border-gray-200/80 dark:border-gray-700/60 flex items-start gap-2.5 text-xs text-ink-normal/90 dark:text-gray-200"
                                >
                                  <span
                                    className={`mt-0.5 shrink-0 text-sm ${
                                      isDone
                                        ? "text-emerald-500"
                                        : isIncomplete
                                        ? "text-amber-500"
                                        : "text-red-500"
                                    }`}
                                  >
                                    {isDone ? "✅" : isIncomplete ? "⏳" : "❌"}
                                  </span>
                                  <span className="flex-1 leading-relaxed">
                                    {it.description}
                                  </span>
                                  <span className="text-[11px] font-bold text-gray-400">
                                    {isDone
                                      ? "انجام شد"
                                      : isIncomplete
                                      ? "نیمه‌کاره"
                                      : "متوقف"}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : null}

                      {rep.rawText && (
                        <div className="p-3 rounded-lg bg-white dark:bg-[#121824] border border-gray-200/70 dark:border-gray-800 text-xs text-ink-normal/80 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                          <div className="font-bold text-gray-400 mb-1">
                            متن خام گزارش:
                          </div>
                          {rep.rawText}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Daily Report Submission Modal */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title={todayReport ? "ویرایش گزارش روزانه امروز" : "ثبت گزارش روزانه جدید"}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmitReport} className="space-y-4">
          <div className="p-3 rounded-xl bg-ecosystem-light/60 dark:bg-ecosystem-darker/30 border border-primary/30 flex items-center gap-2.5 text-xs text-ecosystem-darker dark:text-ecosystem-light">
            <Info className="w-4 h-4 shrink-0 text-primary" />
            <span>
              گزارش برای تاریخ{" "}
              <strong>
                {formatToJalali(todayStr, { showMonthName: true, includeDayName: true })}
              </strong>{" "}
              ثبت خواهد شد.
            </span>
          </div>

          {submitError && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-300 font-bold">
              {submitError}
            </div>
          )}

          {submitSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-600 dark:text-emerald-300 font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{submitSuccess}</span>
            </div>
          )}

          {/* Dynamic items input */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-sec dark:text-white">
                فعالیت‌ها و وظایف کاری امروز:
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-black text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن مورد جدید</span>
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {items.map((it, idx) => (
                <div
                  key={it.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 dark:bg-[#121824] border border-gray-200 dark:border-gray-700"
                >
                  <span className="text-xs font-bold text-gray-400 w-5 text-center">
                    {toPersianDigits(idx + 1)}
                  </span>

                  <input
                    type="text"
                    value={it.description}
                    onChange={(e) =>
                      handleUpdateItem(it.id, "description", e.target.value)
                    }
                    placeholder="شرح وظیفه یا کار انجام‌شده..."
                    className="flex-1 text-xs font-medium bg-white dark:bg-[#161D2A] p-2 rounded-lg border border-gray-200 dark:border-gray-700 focus:border-primary focus:outline-none text-sec dark:text-white"
                  />

                  <select
                    value={it.status}
                    onChange={(e) =>
                      handleUpdateItem(
                        it.id,
                        "status",
                        e.target.value as "done" | "incomplete" | "cancelled"
                      )
                    }
                    className="text-xs font-bold p-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161D2A] text-sec dark:text-white focus:border-primary focus:outline-none"
                  >
                    <option value="done">انجام شد ✅</option>
                    <option value="incomplete">نیمه‌کاره ⏳</option>
                    <option value="cancelled">متوقف ❌</option>
                  </select>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(it.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                      title="حذف این مورد"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Raw notes or remarks */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-sec dark:text-white">
              توضیحات و یادداشت تکمیلی (اختیاری):
            </label>
            <textarea
              rows={3}
              value={rawNotes}
              onChange={(e) => setRawNotes(e.target.value)}
              placeholder="نکات، چالش‌ها یا موانعی که با آن‌ها روبرو شدید..."
              className="w-full text-xs font-medium p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121824] text-sec dark:text-white focus:border-primary focus:outline-none leading-relaxed"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              انصراف
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rokad-btn-primary px-5 py-2 rounded-xl text-xs font-black shadow-sm flex items-center gap-2"
            >
              {submitting ? (
                <span>در حال ثبت...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{todayReport ? "به‌روزرسانی گزارش" : "ثبت نهایی گزارش"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
