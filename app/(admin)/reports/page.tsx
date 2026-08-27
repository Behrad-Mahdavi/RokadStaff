"use client";

import React, { useEffect, useState } from "react";
import {
  Calendar,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Check,
  X,
  Hourglass,
  History,
  Eye,
  Search,
  Filter,
} from "lucide-react";
import Modal from "@/components/Modal";
import {
  formatToJalali,
  formatTehranTime,
  getTehranDateString,
  toPersianDigits,
} from "@/lib/utils";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<string>(getTehranDateString());
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [search, setSearch] = useState("");

  // Modal for viewing single report details & audit history
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [reportDetails, setReportDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("date", currentDate);
      if (selectedDept !== "all") params.append("department", selectedDept);
      if (selectedStatus !== "all") params.append("status", selectedStatus);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error("Fetch reports error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [currentDate, selectedDept, selectedStatus]);

  // Navigate Date
  const handleDateChange = (days: number) => {
    const parts = currentDate.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    setCurrentDate(`${y}-${m}-${day}`);
  };

  const handleSetToday = () => {
    setCurrentDate(getTehranDateString());
  };

  // Open Details Modal
  const handleViewReportDetails = async (rep: any) => {
    setSelectedReport(rep);
    setDetailsLoading(true);
    try {
      const res = await fetch(`/api/reports/${rep.id}`);
      if (res.ok) {
        const data = await res.json();
        setReportDetails(data.report);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Unique departments
  const departments = Array.from(new Set(reports.map((r) => r.employeeDepartment).filter(Boolean)));

  const filteredReports = search
    ? reports.filter((r) => r.employeeFullName.toLowerCase().includes(search.toLowerCase()))
    : reports;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Date Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-sec">گزارش‌های روزانه</h1>
          <p className="text-xs text-ink-normal/60 mt-1">
            مشاهده و بررسی چک‌لیست‌های پایان روز کارکنان با امکان فیلتر تاریخ و دپارتمان
          </p>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-[2px_2px_0_#202A5A]">
          <button
            onClick={() => handleDateChange(-1)}
            title="روز قبل"
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-ecosystem-light rounded-xl font-bold text-xs text-ecosystem-darker border border-primary/20">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            <span>{formatToJalali(currentDate, { showMonthName: true, includeDayName: true })}</span>
          </div>

          <button
            onClick={() => handleDateChange(1)}
            title="روز بعد"
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleSetToday}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-gray-100 hover:bg-gray-200 text-sec transition-colors"
          >
            امروز
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAEAEA] shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="جستجوی نام کارمند..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-10 py-2 rounded-xl border border-gray-200 text-xs focus:border-primary focus:outline-none bg-[#FAFAFA] focus:bg-white"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-2.5" />
        </div>

        <div className="w-full md:w-48">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-[#FAFAFA] focus:border-primary focus:outline-none"
          >
            <option value="all">همه دپارتمان‌ها</option>
            {departments.map((d: any) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="w-full md:w-36">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-[#FAFAFA] focus:border-primary focus:outline-none"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="on_time">به‌موقع</option>
            <option value="late">با تأخیر</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-48 bg-white rounded-2xl border animate-pulse" />
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center shadow-sm">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-sec">هیچ گزارشی برای این تاریخ ثبت نشده است.</h3>
          <p className="text-xs text-ink-normal/50 mt-1">
            با استفاده از فلش‌های بالای صفحه می‌توانید تاریخ‌های قبل و بعد را بررسی کنید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredReports.map((rep) => (
            <div
              key={rep.id}
              className="bg-white rounded-2xl p-5 border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A] hover:shadow-[4px_4px_0_#202A5A] transition-all flex flex-col justify-between"
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-sec">{rep.employeeFullName}</h3>
                    <div className="text-xs text-ink-normal/60 mt-0.5">
                      {rep.employeeDepartment || "عمومی"} {rep.employeePosition ? `• ${rep.employeePosition}` : ""}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                        rep.status === "on_time"
                          ? "bg-ecosystem-light text-ecosystem-darker border-primary/30"
                          : "bg-female-light text-female-darker border-female-normal/30"
                      }`}
                    >
                      {rep.status === "on_time" ? "به‌موقع" : "با تأخیر"}
                    </span>
                    {rep.editedCount > 0 && (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-gray-100 text-ink-normal/70 border border-gray-200 flex items-center gap-1">
                        <History className="w-3 h-3" />
                        <span>ویرایش شده</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-[11px] font-bold text-ink-normal/70 mb-1">
                    <span>نرخ تکمیل وظایف: ٪{toPersianDigits(rep.stats.completionRate)}</span>
                    <span>
                      {toPersianDigits(rep.stats.doneTasks)} از {toPersianDigits(rep.stats.totalTasks)} انجام شد
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-ecosystem-dark rounded-full"
                      style={{ width: `${rep.stats.completionRate}%` }}
                    />
                  </div>
                </div>

                {/* Checklist Items Preview */}
                <div className="space-y-2 mb-4 bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                  {rep.items.slice(0, 4).map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate pl-2">
                        <span className="font-bold text-sec">{toPersianDigits(item.taskOrder)}.</span>
                        <span className="truncate text-ink-normal/90">{item.description}</span>
                      </div>
                      <span
                        className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          item.status === "done"
                            ? "bg-ecosystem-light text-ecosystem-darker"
                            : item.status === "incomplete"
                            ? "bg-college-light text-college-darker"
                            : "bg-female-light text-female-darker"
                        }`}
                      >
                        {item.status === "done"
                          ? "انجام شد"
                          : item.status === "incomplete"
                          ? "ناقص مانده"
                          : "لغو شد"}
                      </span>
                    </div>
                  ))}

                  {rep.items.length > 4 && (
                    <div className="text-[11px] text-center text-primary font-bold pt-1">
                      + {toPersianDigits(rep.items.length - 4)} تسک دیگر...
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1 text-[11px] text-ink-normal/50">
                  <Clock className="w-3.5 h-3.5" />
                  <span>ثبت: {formatTehranTime(rep.submittedAt)}</span>
                </div>

                <button
                  onClick={() => handleViewReportDetails(rep)}
                  className="rokad-btn-outline px-3 py-1.5 text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  <span>مشاهده جزئیات کامل</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Full Report Details & Audit Trail */}
      <Modal
        isOpen={!!selectedReport}
        onClose={() => {
          setSelectedReport(null);
          setReportDetails(null);
        }}
        title={`جزئیات گزارش ${selectedReport?.employeeFullName || ""}`}
        maxWidth="lg"
      >
        {detailsLoading ? (
          <div className="py-8 text-center text-xs text-gray-400">در حال دریافت جزئیات...</div>
        ) : reportDetails ? (
          <div className="space-y-5">
            {/* Meta header */}
            <div className="p-3.5 bg-ecosystem-light/60 rounded-xl border border-primary/20 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div>
                <span className="text-ink-normal/60">تاریخ گزارش: </span>
                <span className="font-bold text-sec">{formatToJalali(reportDetails.reportDate)}</span>
              </div>
              <div>
                <span className="text-ink-normal/60">ساعت ثبت: </span>
                <span className="font-bold text-sec">{formatTehranTime(reportDetails.submittedAt)}</span>
              </div>
              <div>
                <span className="text-ink-normal/60">وضعیت: </span>
                <span className="font-bold text-sec">
                  {reportDetails.status === "on_time" ? "به‌موقع" : "با تأخیر"}
                </span>
              </div>
            </div>

            {/* Checklist Items */}
            <div>
              <h4 className="text-xs font-bold text-sec mb-2">لیست تسک‌های ارسالی:</h4>
              <div className="space-y-2">
                {reportDetails.items?.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white rounded-xl border border-gray-200 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center font-bold text-sec text-[11px]">
                        {toPersianDigits(item.taskOrder)}
                      </span>
                      <span className="font-medium text-ink-normal">{item.description}</span>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        item.status === "done"
                          ? "bg-ecosystem-light text-ecosystem-darker border border-primary/30"
                          : item.status === "incomplete"
                          ? "bg-college-light text-college-darker border border-college-normal/30"
                          : "bg-female-light text-female-darker border border-female-normal/30"
                      }`}
                    >
                      {item.status === "done"
                        ? "✅ انجام شد"
                        : item.status === "incomplete"
                        ? "⏳ ناقص مانده"
                        : "❌ لغو شد"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw Message Text */}
            <div>
              <h4 className="text-xs font-bold text-sec mb-1.5">متن خام پیام ارسالی از تلگرام:</h4>
              <pre className="p-3 bg-[#292827] text-[#EEF8F7] rounded-xl text-xs font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed dir-ltr text-left">
                {reportDetails.rawText}
              </pre>
            </div>

            {/* History / Audit Trail if replaced */}
            {reportDetails.history && reportDetails.history.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-sec mb-2 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-college-normal" />
                  <span>تاریخچه نسخه‌های قبلی گزارش (Audit Trail):</span>
                </h4>
                <div className="space-y-2">
                  {reportDetails.history.map((h: any, idx: number) => (
                    <div key={h.id} className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs">
                      <div className="text-[11px] font-bold text-ink-normal/60 mb-1">
                        نسخه {toPersianDigits(idx + 1)} — جایگزین شده در ساعت {formatTehranTime(h.replacedAt)}
                      </div>
                      <pre className="text-[11px] text-gray-700 font-mono whitespace-pre-wrap dir-ltr text-left">
                        {h.rawText}
                      </pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
