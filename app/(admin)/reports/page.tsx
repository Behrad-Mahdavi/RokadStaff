"use client";

import React, { useEffect, useState } from "react";
import {
  FileCheck2,
  Search,
  Calendar,
  Clock,
  Eye,
  CheckCircle2,
  Hourglass,
  XCircle,
  Filter,
  Layers,
  ChevronLeft,
  ChevronRight,
  Sparkles,
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
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDate, setSelectedDate] = useState(getTehranDateString());

  // Report details modal
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedDept !== "all") params.append("department", selectedDept);
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (selectedDate) params.append("date", selectedDate);

      const res = await fetch(`/api/reports?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [search, selectedDept, selectedStatus, selectedDate]);

  const changeDateByDays = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(getTehranDateString(current));
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-sec tracking-tight">گزارش‌های روزانه کارکنان</h1>
          <p className="text-xs sm:text-sm text-ink-normal/70 mt-1 font-medium">
            مشاهده، جستجو و بررسی چک‌لیست‌های ثبت‌شده از طریق تلگرام
          </p>
        </div>

        {/* Date Navigator Quick Bar */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm self-start md:self-auto">
          <button
            onClick={() => changeDateByDays(1)}
            className="p-2 hover:bg-gray-100 rounded-xl text-sec transition-colors"
            title="روز بعد"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 px-3 py-1 font-bold text-xs sm:text-sm text-sec">
            <Calendar className="w-4 h-4 text-primary" />
            <span>{formatToJalali(selectedDate, { showMonthName: true, includeDayName: true })}</span>
          </div>
          <button
            onClick={() => changeDateByDays(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl text-sec transition-colors"
            title="روز قبل"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setSelectedDate(getTehranDateString())}
            className="px-3 py-1.5 bg-ecosystem-light text-ecosystem-darker rounded-xl text-xs sm:text-sm font-bold border border-primary/30 hover:bg-ecosystem-light-hover transition-colors"
          >
            امروز
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-[#EAEAEA] shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="جستجوی نام کارمند یا بخشی از تسک..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-11 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm focus:border-primary focus:outline-none bg-[#FAFAFA] focus:bg-white font-medium"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-4 top-3.5" />
        </div>

        {/* Date Selector Input */}
        <div className="w-full md:w-44">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-[#FAFAFA] focus:border-primary focus:outline-none font-bold text-sec font-mono"
          />
        </div>

        {/* Department Filter */}
        <div className="w-full md:w-44">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-[#FAFAFA] focus:border-primary focus:outline-none font-bold text-sec"
          >
            <option value="all">همه دپارتمان‌ها</option>
            <option value="پسرانه">پسرانه</option>
            <option value="دخترانه">دخترانه</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-40">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-xs sm:text-sm bg-[#FAFAFA] focus:border-primary focus:outline-none font-bold text-sec"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="on_time">به‌موقع</option>
            <option value="late">با تأخیر</option>
          </select>
        </div>
      </div>

      {/* Reports Table / Card Container */}
      <div className="bg-white rounded-3xl border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs sm:text-sm">
            <thead className="bg-[#F8F9FA] border-b border-gray-200 text-ink-normal/70 font-bold">
              <tr>
                <th className="py-4 px-4 sm:px-6">کارمند</th>
                <th className="py-4 px-4">دپارتمان</th>
                <th className="py-4 px-4">ساعت ارسال</th>
                <th className="py-4 px-4">وضعیت ارسال</th>
                <th className="py-4 px-4">خلاصه پیشرفت تسک‌ها</th>
                <th className="py-4 px-4 sm:px-6 text-center">جزئیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-gray-400">
                    در حال بارگذاری گزارش‌ها...
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-sm text-gray-400">
                    گزارشی در این تاریخ با مشخصات انتخاب‌شده ثبت نشده است.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-4 px-4 sm:px-6 font-bold text-sec">
                      <div className="font-black text-sm sm:text-base text-sec">{report.employeeFullName}</div>
                      <div className="text-xs text-ink-normal/50 mt-0.5">{report.employeePosition || "همکار"}</div>
                    </td>
                    <td className="py-4 px-4 font-bold text-ink-normal/80">
                      {report.employeeDepartment || "پسرانه"}
                    </td>
                    <td className="py-4 px-4 font-mono font-bold text-sec text-xs sm:text-sm">
                      {formatTehranTime(report.submittedAt)}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-bold text-xs border ${
                          report.status === "on_time"
                            ? "bg-ecosystem-light text-ecosystem-darker border-primary/30"
                            : "bg-female-light text-female-darker border-female-normal/30"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {report.status === "on_time" ? "به‌موقع" : "با تأخیر"}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sec text-xs sm:text-sm">
                          {toPersianDigits(report.stats.done)} از {toPersianDigits(report.stats.total)} تسک
                        </span>
                        <span className="text-xs text-ink-normal/60 font-bold bg-gray-100 px-2 py-0.5 rounded-md">
                          (٪{toPersianDigits(report.stats.rate)})
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 sm:px-6 text-center">
                      <button
                        onClick={() => {
                          setSelectedReport(report);
                          setIsDetailModalOpen(true);
                        }}
                        className="rokad-btn-outline px-3.5 py-1.5 text-xs sm:text-sm rounded-xl font-bold"
                      >
                        <Eye className="w-4 h-4 text-primary" />
                        <span>مشاهده چک‌لیست</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: View Report Checklist Details */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`چک‌لیست گزارش کار: ${selectedReport?.employeeFullName || ""}`}
        maxWidth="lg"
      >
        {selectedReport && (
          <div className="space-y-5">
            {/* Header info */}
            <div className="p-4 rounded-2xl bg-[#F8F9FA] border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-ink-normal/60">تاریخ گزارش: </span>
                <span className="font-bold text-sec">{selectedReport.reportDateJalali}</span>
              </div>
              <div>
                <span className="text-ink-normal/60">ساعت ثبت: </span>
                <span className="font-bold text-sec font-mono">{selectedReport.submittedAtTime}</span>
              </div>
              <div>
                <span
                  className={`font-black px-2.5 py-0.5 rounded-full text-xs ${
                    selectedReport.status === "on_time"
                      ? "bg-ecosystem-light text-ecosystem-darker"
                      : "bg-female-light text-female-darker"
                  }`}
                >
                  {selectedReport.status === "on_time" ? "به‌موقع" : "با تأخیر"}
                </span>
              </div>
            </div>

            {/* Checklist Items */}
            <div className="space-y-3">
              <h4 className="text-sm font-black text-sec">آیتم‌های چک‌لیست ({toPersianDigits(selectedReport.items.length)} مورد):</h4>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {selectedReport.items.map((item: any, idx: number) => {
                  let statusBg = "bg-gray-50 border-gray-200";
                  let statusIcon = <Hourglass className="w-4 h-4 text-college-normal" />;
                  let statusLabel = "ناقص مانده";
                  let statusColor = "text-college-darker";

                  if (item.status === "done") {
                    statusBg = "bg-ecosystem-light/60 border-primary/30";
                    statusIcon = <CheckCircle2 className="w-4 h-4 text-primary" />;
                    statusLabel = "انجام شد";
                    statusColor = "text-ecosystem-darker";
                  } else if (item.status === "cancelled") {
                    statusBg = "bg-female-light/60 border-female-normal/30";
                    statusIcon = <XCircle className="w-4 h-4 text-female-normal" />;
                    statusLabel = "لغو شد";
                    statusColor = "text-female-darker";
                  }

                  return (
                    <div
                      key={item.id || idx}
                      className={`p-3.5 rounded-2xl border ${statusBg} flex items-start justify-between gap-3 text-xs sm:text-sm`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="font-black text-sec shrink-0 mt-0.5">{toPersianDigits(item.taskOrder)}-</span>
                        <span className="font-bold text-ink-darker leading-relaxed">{item.description}</span>
                      </div>
                      <div className={`flex items-center gap-1.5 font-black text-xs shrink-0 ${statusColor}`}>
                        {statusIcon}
                        <span>{statusLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Raw Text Box */}
            <div>
              <h4 className="text-xs font-bold text-ink-normal/60 mb-1.5">متن خام ارسال شده در تلگرام:</h4>
              <pre className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs font-mono whitespace-pre-wrap text-ink-normal/80 max-h-36 overflow-y-auto">
                {selectedReport.rawText}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
