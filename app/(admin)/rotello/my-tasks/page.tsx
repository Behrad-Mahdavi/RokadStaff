"use client";

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  CheckSquare,
  Sparkles,
  Archive,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import StatCard from "@/components/StatCard";
import TaskModal from "@/components/rotello/TaskModal";
import { formatToJalali, toPersianDigits } from "@/lib/utils";
import Link from "next/link";

export default function PersonalWorkspacePage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const fetchWorkspace = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/rotello/workspace/my-tasks?archived=${showArchived}`);
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
    fetchWorkspace();
  }, [showArchived]);

  const summary = data?.summary || { total: 0, overdue: 0, thisWeek: 0, completed: 0 };
  const tasks = data?.tasks || {
    overdue: [],
    todayOrThisWeek: [],
    noDeadlineOrLater: [],
    completedRecently: [],
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-ecosystem-light via-white to-male-light/40 dark:from-[#151C28] dark:via-[#161E2C] dark:to-[#151C28] p-6 sm:p-7 rounded-3xl border-2 border-primary/20 dark:border-gray-800 shadow-[3px_3px_0_#59BBAF]">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-primary mb-1.5">
            <Briefcase className="w-4 h-4" />
            <span>میز کار جامع وظایف</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-sec dark:text-white tracking-tight">میز کار من</h1>
          <p className="text-xs sm:text-sm text-ink-normal/70 dark:text-gray-400 mt-1 font-medium">
            مشاهده یکپارچه تمام وظایف واگذارشده به شما از پروژه‌های مختلف
          </p>
        </div>

        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`px-4 py-3 text-xs sm:text-sm rounded-xl font-bold border transition-colors flex items-center gap-1.5 self-start md:self-auto ${
            showArchived
              ? "bg-gray-200 dark:bg-gray-700 text-sec dark:text-white border-gray-300 dark:border-gray-600"
              : "bg-white dark:bg-[#161D2A] text-ink-normal/70 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>{showArchived ? "عدم نمایش آرشیو" : "نمایش وظایف پروژه‌های آرشیوشده"}</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="کل وظایف من"
          value={`${toPersianDigits(summary.total)} وظیفه`}
          subtitle="مجموع وظایف در تمام پروژه‌ها"
          icon={Layers}
          theme="ecosystem"
        />

        <StatCard
          title="وظایف عقب‌افتاده"
          value={`${toPersianDigits(summary.overdue)} وظیفه`}
          subtitle="نیازمند پیگیری و اقدام فوری"
          icon={AlertCircle}
          theme="college"
        />

        <StatCard
          title="مهلت انجام این هفته"
          value={`${toPersianDigits(summary.thisWeek)} وظیفه`}
          subtitle="مهلت تا ۷ روز آینده"
          icon={Calendar}
          theme="male"
        />

        <StatCard
          title="تکمیل‌شده‌های اخیر"
          value={`${toPersianDigits(summary.completed)} وظیفه`}
          subtitle="وظایف با موفقیت انجام‌شده"
          icon={CheckCircle2}
          theme="club"
        />
      </div>

      {/* Task Buckets Section */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-white rounded-3xl border animate-pulse p-6" />
          ))}
        </div>
      ) : summary.total === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#151C28] rounded-3xl border border-dashed border-gray-300 dark:border-gray-700 p-8">
          <Briefcase className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-black text-sec dark:text-white">هیچ وظیفه‌ای به شما واگذار نشده است</h3>
          <p className="text-xs sm:text-sm text-ink-normal/60 dark:text-gray-400 mt-1">
            با ایجاد وظیفه جدید در پروژه‌ها یا واگذاری کار توسط مدیر، وظایف در این میز کار نمایان می‌شوند.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. Overdue Bucket */}
          {tasks.overdue.length > 0 && (
            <div className="bg-white dark:bg-[#151C28] rounded-3xl p-6 sm:p-7 border-2 border-red-200 dark:border-red-900/60 shadow-[3px_3px_0_#DF5C5C] space-y-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-black text-base">
                <AlertCircle className="w-5 h-5" />
                <span>عقب‌افتاده و نیازمند اقدام فوری ({toPersianDigits(tasks.overdue.length)})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.overdue.map((t: any) => (
                  <TaskCard key={t.id} task={t} onSelect={() => setSelectedTaskId(t.id)} isOverdue />
                ))}
              </div>
            </div>
          )}

          {/* 2. Today & This Week Bucket */}
          {tasks.todayOrThisWeek.length > 0 && (
            <div className="bg-white dark:bg-[#151C28] rounded-3xl p-6 sm:p-7 border border-[#EAEAEA] dark:border-gray-800 shadow-[3px_3px_0_#202A5A] dark:shadow-[3px_3px_0_#59BBAF] space-y-4">
              <div className="flex items-center gap-2 text-college-darker dark:text-college-light font-black text-base">
                <Calendar className="w-5 h-5 text-college-normal" />
                <span>موعد امروز و این هفته ({toPersianDigits(tasks.todayOrThisWeek.length)})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.todayOrThisWeek.map((t: any) => (
                  <TaskCard key={t.id} task={t} onSelect={() => setSelectedTaskId(t.id)} />
                ))}
              </div>
            </div>
          )}

          {/* 3. No Deadline or Later */}
          {tasks.noDeadlineOrLater.length > 0 && (
            <div className="bg-white dark:bg-[#151C28] rounded-3xl p-6 sm:p-7 border border-[#EAEAEA] dark:border-gray-800 shadow-[3px_3px_0_#202A5A] dark:shadow-[3px_3px_0_#59BBAF] space-y-4">
              <div className="flex items-center gap-2 text-sec dark:text-white font-black text-base">
                <Layers className="w-5 h-5 text-primary" />
                <span>سایر وظایف در دست اقدام ({toPersianDigits(tasks.noDeadlineOrLater.length)})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.noDeadlineOrLater.map((t: any) => (
                  <TaskCard key={t.id} task={t} onSelect={() => setSelectedTaskId(t.id)} />
                ))}
              </div>
            </div>
          )}

          {/* 4. Completed Recently */}
          {tasks.completedRecently.length > 0 && (
            <div className="bg-white dark:bg-[#151C28] rounded-3xl p-6 sm:p-7 border border-[#EAEAEA] dark:border-gray-800 shadow-[3px_3px_0_#202A5A] dark:shadow-[3px_3px_0_#59BBAF] space-y-4">
              <div className="flex items-center gap-2 text-ecosystem-darker dark:text-ecosystem-light font-black text-base">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span>تکمیل‌شده‌های اخیر ({toPersianDigits(tasks.completedRecently.length)})</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tasks.completedRecently.map((t: any) => (
                  <TaskCard key={t.id} task={t} onSelect={() => setSelectedTaskId(t.id)} isDone />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Task Modal */}
      <TaskModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={fetchWorkspace}
      />
    </div>
  );
}

function TaskCard({
  task,
  onSelect,
  isOverdue,
  isDone,
}: {
  task: any;
  onSelect: () => void;
  isOverdue?: boolean;
  isDone?: boolean;
}) {
  return (
    <div
      onClick={onSelect}
      className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-3 bg-[#FCFDFD] dark:bg-[#1C2536] hover:bg-white dark:hover:bg-[#202B3E] hover:shadow-md ${
        isOverdue
          ? "border-red-300 dark:border-red-900/80 hover:border-red-500"
          : isDone
          ? "border-gray-200 dark:border-gray-700 opacity-80"
          : "border-gray-200 dark:border-gray-700 hover:border-primary"
      }`}
    >
      <div className="flex items-center justify-between gap-1 text-xs font-bold">
        <span className="text-sec dark:text-gray-200 font-black bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 rounded-full">
          {task.projectName}
        </span>

        <span
          className={`px-2 py-0.5 rounded-full ${
            task.priority === "urgent"
              ? "bg-female-light dark:bg-female-darker/60 text-female-darker dark:text-female-light"
              : task.priority === "important"
              ? "bg-college-light dark:bg-college-darker/60 text-college-darker dark:text-college-light"
              : "bg-gray-100 dark:bg-gray-800 text-ink-normal/60 dark:text-gray-400"
          }`}
        >
          {task.priority === "urgent" ? "فوری" : task.priority === "important" ? "مهم" : "عادی"}
        </span>
      </div>

      <h4 className={`text-sm font-black text-sec dark:text-white leading-snug ${isDone ? "line-through text-gray-400 dark:text-gray-500" : ""}`}>
        {task.title}
      </h4>

      {task.progress && task.progress.total > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-ink-normal/60 dark:text-gray-400 font-bold">
            <span>چک‌لیست</span>
            <span>
              {toPersianDigits(task.progress.done)}/{toPersianDigits(task.progress.total)} (٪{toPersianDigits(task.progress.rate)})
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: `${task.progress.rate}%` }} />
          </div>
        </div>
      )}

      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-ink-normal/60 dark:text-gray-400 font-medium">
        <span className="font-bold text-sec dark:text-gray-300">{task.columnName}</span>
        {task.deadline && (
          <span className={`font-mono font-bold ${isOverdue ? "text-red-600 dark:text-red-400" : ""}`}>
            {formatToJalali(task.deadline)}
          </span>
        )}
      </div>
    </div>
  );
}
