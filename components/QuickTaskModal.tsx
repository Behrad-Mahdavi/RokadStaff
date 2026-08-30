"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import {
  Plus,
  FolderKanban,
  User,
  Users,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import PersianDatePicker from "@/components/PersianDatePicker";
import { toPersianDigits } from "@/lib/utils";
import Link from "next/link";

interface QuickTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated?: () => void;
}

export default function QuickTaskModal({
  isOpen,
  onClose,
  onTaskCreated,
}: QuickTaskModalProps) {
  const [taskType, setTaskType] = useState<"project" | "individual">("project");
  const [projects, setProjects] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Form fields
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [createdResult, setCreatedResult] = useState<{
    task: any;
    projectName?: string;
  } | null>(null);

  // Fetch active projects (unarchived) and active employees
  useEffect(() => {
    if (!isOpen) return;

    setLoadingData(true);
    setCreatedResult(null);
    setErrorMessage("");

    Promise.all([
      fetch("/api/rotello/projects").then((res) => res.json()),
      fetch("/api/employees").then((res) => res.json()),
    ])
      .then(([projData, empData]) => {
        if (projData.projects) {
          // Filter out archived projects (Decision 2)
          const activeProjects = projData.projects.filter(
            (p: any) => !p.isArchived
          );
          setProjects(activeProjects);
          if (activeProjects.length > 0) {
            setSelectedProjectId(activeProjects[0].id);
          }
        }
        if (empData.employees) {
          setEmployees(empData.employees.filter((e: any) => e.isActive));
        }
      })
      .catch((err) => {
        console.error("Error fetching projects/employees:", err);
      })
      .finally(() => {
        setLoadingData(false);
      });
  }, [isOpen]);

  const handleToggleAssignee = (empId: string) => {
    setSelectedAssignees((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage("عنوان تسک الزامی است.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      if (taskType === "project") {
        if (!selectedProjectId) {
          setErrorMessage("لطفاً یک پروژه را انتخاب کنید.");
          setSubmitting(false);
          return;
        }

        // Fetch project columns to find entry column
        const colRes = await fetch(`/api/rotello/projects/${selectedProjectId}/columns`);
        const colData = await colRes.json();
        const cols = colData.columns || [];

        // Find column with isEntryColumn === true or default to first column
        const entryColumn = cols.find((c: any) => c.isEntryColumn) || cols[0];

        if (!entryColumn) {
          setErrorMessage("این پروژه هیچ ستونی برای درج تسک ندارد.");
          setSubmitting(false);
          return;
        }

        // Create project task
        const res = await fetch("/api/rotello/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId: selectedProjectId,
            columnId: entryColumn.id,
            title: title.trim(),
            description: description.trim() || null,
            priority,
            deadline: deadline || null,
            assigneeIds: selectedAssignees,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          const selectedProj = projects.find((p) => p.id === selectedProjectId);
          setCreatedResult({
            task: data.task,
            projectName: selectedProj?.name || "پروژه",
          });
          resetForm();
          if (onTaskCreated) onTaskCreated();
        } else {
          setErrorMessage(data.error || "خطا در ایجاد تسک پروژه‌ای");
        }
      } else {
        // Individual Task
        if (selectedAssignees.length === 0) {
          setErrorMessage("لطفاً حداقل یک همکار مسئول برای تسک فردی انتخاب کنید.");
          setSubmitting(false);
          return;
        }

        const res = await fetch("/api/individual-tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            description: description.trim() || null,
            priority,
            deadline: deadline || null,
            assigneeIds: selectedAssignees,
          }),
        });

        const data = await res.json();
        if (res.ok) {
          setCreatedResult({
            task: data.task,
            projectName: "تسک فردی (مستقل)",
          });
          resetForm();
          if (onTaskCreated) onTaskCreated();
        } else {
          setErrorMessage(data.error || "خطا در ایجاد تسک فردی");
        }
      }
    } catch (err: any) {
      setErrorMessage("خطای ارتباط با سرور رخ داد.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("normal");
    setDeadline("");
    setSelectedAssignees([]);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ایجاد سریع تسک جدید" maxWidth="xl">
      <div className="font-vazirmatn space-y-6">
        {/* Success Banner */}
        {createdResult ? (
          <div className="p-6 bg-ecosystem-light rounded-3xl border-2 border-primary/30 text-center space-y-4 shadow-sm animate-in fade-in">
            <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-black text-sec">تسک جدید با موفقیت ایجاد شد!</h3>
              <p className="text-xs text-ink-normal/70 mt-1">
                تسک «{createdResult.task.title}» در بخش {createdResult.projectName} ثبت گردید و برای همکاران منتسب ارسال شد.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCreatedResult(null)}
                className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-dark transition shadow"
              >
                ایجاد یک تسک دیگر +
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-ink-dark hover:bg-gray-50 transition"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Task Type Switcher */}
            <div className="flex items-center p-1.5 bg-gray-100/80 rounded-2xl border border-gray-200">
              <button
                type="button"
                onClick={() => setTaskType("project")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                  taskType === "project"
                    ? "bg-white text-primary shadow-sm border border-gray-200/80"
                    : "text-ink-normal/60 hover:text-sec"
                }`}
              >
                <FolderKanban className="w-4 h-4" />
                <span>تسک پروژه‌ای (روی بورد کانبان)</span>
              </button>
              <button
                type="button"
                onClick={() => setTaskType("individual")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${
                  taskType === "individual"
                    ? "bg-white text-primary shadow-sm border border-gray-200/80"
                    : "text-ink-normal/60 hover:text-sec"
                }`}
              >
                <User className="w-4 h-4" />
                <span>تسک فردی (واگذاری مستقیم به همکار)</span>
              </button>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-college-light border border-college-normal/30 text-college-darker text-xs font-bold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Project Selector (If Project Task) */}
            {taskType === "project" && (
              <div>
                <label className="block text-xs font-bold text-ink-normal/70 mb-1.5 flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5 text-primary" />
                  <span>انتخاب پروژه مقصد:</span>
                  <span className="text-college-normal">*</span>
                </label>
                {projects.length === 0 ? (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-400">
                    هیچ پروژه فعالی یافت نشد. ابتدا یک پروژه ایجاد کنید.
                  </div>
                ) : (
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full text-xs font-bold p-3 rounded-xl border border-gray-200 bg-white focus:border-primary focus:outline-none text-sec"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Task Title */}
            <div>
              <label className="block text-xs font-bold text-ink-normal/70 mb-1.5">
                عنوان تسک: <span className="text-college-normal">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: طراحی صفحه اصلی / بررسی قراردادها..."
                className="w-full text-sm font-bold text-sec p-3 rounded-xl border border-gray-200 focus:border-primary focus:outline-none placeholder:text-gray-300"
              />
            </div>

            {/* Task Description */}
            <div>
              <label className="block text-xs font-bold text-ink-normal/70 mb-1.5">
                توضیحات تکمیلی (اختیاری):
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="شرح جزئیات یا نیازمندی‌های این تسک..."
                className="w-full text-xs font-medium text-ink-darker p-3 rounded-xl border border-gray-200 focus:border-primary focus:outline-none placeholder:text-gray-300 leading-relaxed"
              />
            </div>

            {/* Priority & Deadline Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <div>
                <label className="block text-xs font-bold text-ink-normal/60 mb-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-college-normal" />
                  <span>اولویت:</span>
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-200 bg-white focus:border-primary focus:outline-none text-sec"
                >
                  <option value="normal">عادی (Normal)</option>
                  <option value="important">مهم (Important)</option>
                  <option value="urgent">فوری (Urgent)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-normal/60 mb-1.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>مهلت انجام (ددلاین شمسی):</span>
                </label>
                <PersianDatePicker
                  value={deadline}
                  onChange={(newDate) => setDeadline(newDate || "")}
                  placeholder="انتخاب مهلت شمسی..."
                />
              </div>
            </div>

            {/* Multi-Assignee Selection */}
            <div>
              <label className="block text-xs font-bold text-ink-normal/70 mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary" />
                  <span>همکاران مسئول تسک (Assignees):</span>
                  {taskType === "individual" && <span className="text-college-normal">*</span>}
                </span>
                <span className="text-xs text-ink-normal/50 font-normal">
                  {toPersianDigits(selectedAssignees.length)} نفر انتخاب شده
                </span>
              </label>

              {employees.length === 0 ? (
                <p className="text-xs text-gray-400">در حال بارگذاری لیست کارکنان...</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-gray-50 rounded-2xl border border-gray-200">
                  {employees.map((emp) => {
                    const isSelected = selectedAssignees.includes(emp.id);
                    return (
                      <button
                        key={emp.id}
                        type="button"
                        onClick={() => handleToggleAssignee(emp.id)}
                        className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold text-right transition border ${
                          isSelected
                            ? "bg-primary text-white border-primary shadow-sm"
                            : "bg-white text-ink-dark border-gray-200 hover:border-primary/50"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border ${
                            isSelected
                              ? "bg-white text-primary border-white"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && <span className="text-[10px]">✓</span>}
                        </div>
                        <span className="truncate">{emp.fullName}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-ink-dark hover:bg-gray-50 transition"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-ecosystem-dark text-white text-xs font-black hover:opacity-95 transition shadow-[2px_2px_0_#202A5A] disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <span>در حال ایجاد تسک...</span>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>ایجاد تسک</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
