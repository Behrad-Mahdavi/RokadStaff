"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import {
  Clock,
  User,
  Users,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Send,
  Sparkles,
  AlertCircle,
  FileText,
  Activity,
  Calendar,
  Layers,
  ChevronDown,
} from "lucide-react";
import { formatToJalali, formatTehranTime, toPersianDigits } from "@/lib/utils";
import PersianDatePicker from "@/components/PersianDatePicker";

interface TaskModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdated?: () => void;
  projectMembers?: any[];
  boardColumns?: any[];
}

export default function TaskModal({
  taskId,
  isOpen,
  onClose,
  onTaskUpdated,
  projectMembers = [],
  boardColumns = [],
}: TaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [taskData, setTaskData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"details" | "timeline">("details");

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [deadline, setDeadline] = useState("");
  const [columnId, setColumnId] = useState("");

  // Assignees
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [organizationEmployees, setOrganizationEmployees] = useState<any[]>([]);

  // Fetch all employees if not provided
  useEffect(() => {
    if (projectMembers && projectMembers.length > 0) {
      setOrganizationEmployees(projectMembers);
    }
    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => {
        if (data.employees && data.employees.length > 0) {
          setOrganizationEmployees(
            data.employees.map((e: any) => ({
              employeeId: e.id,
              fullName: e.fullName,
              department: e.department,
            }))
          );
        }
      })
      .catch(() => {});
  }, [projectMembers]);

  // Checklists
  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [newItemTitleByChecklist, setNewItemTitleByChecklist] = useState<Record<string, string>>({});

  // Timeline report form
  const [reportContent, setReportContent] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [timelineItems, setTimelineItems] = useState<any[]>([]);

  // Fetch full task data
  const fetchTask = async () => {
    if (!taskId) return;
    setLoading(true);
    try {
      const [taskRes, reportsRes] = await Promise.all([
        fetch(`/api/rotello/tasks/${taskId}`),
        fetch(`/api/rotello/tasks/${taskId}/reports`),
      ]);

      if (taskRes.ok) {
        const json = await taskRes.json();
        setTaskData(json);
        setTitle(json.task.title);
        setDescription(json.task.description || "");
        setPriority(json.task.priority);
        setColumnId(json.task.columnId);
        setDeadline(
          json.task.deadline ? new Date(json.task.deadline).toISOString().split("T")[0] : ""
        );
        setSelectedAssignees(json.assignees.map((a: any) => a.employeeId));
      }

      if (reportsRes.ok) {
        const repJson = await reportsRes.json();
        setTimelineItems(repJson.timeline || []);
      }
    } catch (err) {
      console.error("Task detail fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTask();
    }
  }, [isOpen, taskId]);

  // Handle field update
  const handleSaveFields = async () => {
    if (!taskId || !title.trim()) return;
    try {
      const res = await fetch(`/api/rotello/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          priority,
          deadline: deadline || null,
          columnId,
        }),
      });

      if (res.ok) {
        fetchTask();
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Assignee
  const handleToggleAssignee = async (empId: string) => {
    if (!taskId) return;
    const newAssignees = selectedAssignees.includes(empId)
      ? selectedAssignees.filter((id) => id !== empId)
      : [...selectedAssignees, empId];

    setSelectedAssignees(newAssignees);

    try {
      const res = await fetch(`/api/rotello/tasks/${taskId}/assignees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assigneeIds: newAssignees }),
      });
      if (res.ok) {
        fetchTask();
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Checklist
  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !newChecklistTitle.trim()) return;

    try {
      const res = await fetch(`/api/rotello/tasks/${taskId}/checklists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newChecklistTitle }),
      });
      if (res.ok) {
        setNewChecklistTitle("");
        fetchTask();
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Item to Checklist
  const handleAddChecklistItem = async (checklistId: string) => {
    const itemTitle = newItemTitleByChecklist[checklistId]?.trim();
    if (!itemTitle) return;

    try {
      const res = await fetch(`/api/rotello/checklists/${checklistId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: itemTitle }),
      });
      if (res.ok) {
        setNewItemTitleByChecklist((prev) => ({ ...prev, [checklistId]: "" }));
        fetchTask();
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle Checklist Item (isDone)
  const handleToggleChecklistItem = async (itemId: string, currentDone: boolean) => {
    try {
      const res = await fetch(`/api/rotello/checklist-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone: !currentDone }),
      });
      if (res.ok) {
        fetchTask();
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Append-only Narrative Task Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskId || !reportContent.trim()) return;

    setSubmittingReport(true);
    try {
      const res = await fetch(`/api/rotello/tasks/${taskId}/reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: reportContent }),
      });

      if (res.ok) {
        setReportContent("");
        fetchTask();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReport(false);
    }
  };

  // Delete Task
  const handleDeleteTask = async () => {
    if (!confirm("آیا از حذف این تسک اطمینان دارید؟")) return;
    try {
      const res = await fetch(`/api/rotello/tasks/${taskId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onClose();
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={taskData ? taskData.task.title : "جزئیات تسک"}
      maxWidth="xl"
    >
      {loading && !taskData ? (
        <div className="py-16 text-center text-sm text-gray-400">در حال بارگذاری اطلاعات تسک...</div>
      ) : taskData ? (
        <div className="space-y-6 text-right">
          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
                activeTab === "details"
                  ? "bg-ecosystem-light text-ecosystem-darker border border-primary/30 shadow-sm"
                  : "text-ink-normal/60 hover:text-ink-normal"
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>مشخصات و چک‌لیست‌ها</span>
            </button>

            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 ${
                activeTab === "timeline"
                  ? "bg-ecosystem-light text-ecosystem-darker border border-primary/30 shadow-sm"
                  : "text-ink-normal/60 hover:text-ink-normal"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>تایم‌لاین گزارش‌ها و وقایع ({toPersianDigits(timelineItems.length)})</span>
            </button>
          </div>

          {activeTab === "details" ? (
            <div className="space-y-6">
              {/* Task Title & Description */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-ink-normal/60 mb-1">عنوان تسک:</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={handleSaveFields}
                    className="w-full text-base sm:text-lg font-black text-sec p-3 rounded-xl border border-gray-200 focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-normal/60 mb-1">توضیحات تکمیلی:</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={handleSaveFields}
                    placeholder="شرح جزئیات یا نیازمندی‌های این تسک..."
                    className="w-full text-xs sm:text-sm font-medium text-ink-darker p-3 rounded-xl border border-gray-200 focus:border-primary focus:outline-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Meta Grid (Column, Priority, Deadline) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                {/* Column */}
                <div>
                  <label className="block text-xs font-bold text-ink-normal/60 mb-1.5 flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    <span>ستون فعلی:</span>
                  </label>
                  <select
                    value={columnId}
                    onChange={(e) => {
                      setColumnId(e.target.value);
                      setTimeout(handleSaveFields, 50);
                    }}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-200 bg-white focus:border-primary focus:outline-none text-sec"
                  >
                    {boardColumns.map((col: any) => (
                      <option key={col.id} value={col.id}>
                        {col.name} {col.isDoneColumn ? "✅" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-ink-normal/60 mb-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-college-normal" />
                    <span>اولویت:</span>
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => {
                      setPriority(e.target.value);
                      setTimeout(handleSaveFields, 50);
                    }}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-200 bg-white focus:border-primary focus:outline-none text-sec"
                  >
                    <option value="normal">عادی (Normal)</option>
                    <option value="important">مهم (Important)</option>
                    <option value="urgent">فوری (Urgent)</option>
                  </select>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-xs font-bold text-ink-normal/60 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>مهلت انجام (ددلاین):</span>
                  </label>
                  <PersianDatePicker
                    value={deadline}
                    onChange={(newDate) => {
                      setDeadline(newDate);
                      setTimeout(handleSaveFields, 50);
                    }}
                    placeholder="انتخاب مهلت شمسی..."
                  />
                </div>
              </div>

              {/* Multi-Assignees Section */}
              <div>
                <label className="block text-xs font-bold text-ink-normal/60 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" />
                    <span>همکاران مسئول تسک (Assignees):</span>
                  </span>
                  <span className="text-xs text-ink-normal/50">
                    {toPersianDigits(taskData.assignees.length)} نفر
                  </span>
                </label>

                {/* Assigned tags */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {taskData.assignees.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">هنوز کسی به این تسک منتسب نشده است.</span>
                  ) : (
                    taskData.assignees.map((a: any) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ecosystem-light text-ecosystem-darker text-xs font-bold border border-primary/30"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{a.fullName}</span>
                      </span>
                    ))
                  )}
                </div>

                {/* Dropdown to add/remove assignees */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                    className="w-full p-2.5 rounded-xl border border-dashed border-gray-300 text-xs font-bold text-ink-normal/70 hover:border-primary flex items-center justify-between bg-white"
                  >
                    <span>مدیریت و انتخاب همکاران مسئول...</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {isAssigneeDropdownOpen && (
                    <div className="absolute top-full right-0 left-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg p-3 z-30 max-h-48 overflow-y-auto space-y-1">
                      {organizationEmployees.map((member: any) => {
                        const isAssigned = selectedAssignees.includes(member.employeeId);
                        return (
                          <button
                            key={member.employeeId}
                            type="button"
                            onClick={() => handleToggleAssignee(member.employeeId)}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-colors ${
                              isAssigned
                                ? "bg-ecosystem-light text-ecosystem-darker"
                                : "hover:bg-gray-100 text-ink-normal/80"
                            }`}
                          >
                            <span>{member.fullName} ({member.department || "پسرانه"})</span>
                            {isAssigned && <span>✅</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Checklists Section */}
              <div className="space-y-4 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-sec flex items-center gap-2">
                    <CheckSquare className="w-4 h-4 text-primary" />
                    <span>چک‌لیست‌های مرحله‌ای</span>
                  </h3>
                </div>

                {/* Checklists Loop */}
                {taskData.checklists.map((chk: any) => {
                  const doneCount = chk.items.filter((i: any) => i.isDone).length;
                  const totalCount = chk.items.length;
                  const percent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

                  return (
                    <div key={chk.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                      {/* Header & Progress */}
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-sec font-black text-sm">{chk.title}</span>
                        <span className="text-ink-normal/60">
                          {toPersianDigits(doneCount)} از {toPersianDigits(totalCount)} (٪{toPersianDigits(percent)})
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      {/* Items */}
                      <div className="space-y-2 pt-1">
                        {chk.items.map((item: any) => (
                          <div
                            key={item.id}
                            onClick={() => handleToggleChecklistItem(item.id, item.isDone)}
                            className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white cursor-pointer transition-colors"
                          >
                            <div className="mt-0.5 text-primary">
                              {item.isDone ? (
                                <CheckSquare className="w-4 h-4 text-primary" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-300" />
                              )}
                            </div>
                            <div className="flex-1 text-xs sm:text-sm font-medium">
                              <span className={item.isDone ? "line-through text-ink-normal/40 font-normal" : "text-sec font-bold"}>
                                {item.title}
                              </span>
                              {item.doneByName && (
                                <div className="text-[11px] text-ink-normal/40 mt-0.5">
                                  {item.isDone ? "تیک‌خورده توسط" : "آخرین تعامل توسط"}: {item.doneByName}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add item input */}
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60">
                        <input
                          type="text"
                          placeholder="آیتم جدید برای این مرحله..."
                          value={newItemTitleByChecklist[chk.id] || ""}
                          onChange={(e) =>
                            setNewItemTitleByChecklist({
                              ...newItemTitleByChecklist,
                              [chk.id]: e.target.value,
                            })
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddChecklistItem(chk.id);
                            }
                          }}
                          className="flex-1 text-xs p-2 rounded-xl border border-gray-200 bg-white focus:border-primary focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddChecklistItem(chk.id)}
                          className="px-3 py-2 bg-white hover:bg-ecosystem-light text-sec text-xs font-bold rounded-xl border border-gray-200 transition-colors"
                        >
                          افزودن
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add new checklist box */}
                <form onSubmit={handleAddChecklist} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="عنوان چک‌لیست جدید (مثلاً: مرحله تست و بازبینی)..."
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    className="flex-1 text-xs p-3 rounded-2xl border border-gray-300 focus:border-primary focus:outline-none bg-white"
                  />
                  <button
                    type="submit"
                    className="rokad-btn-outline px-4 py-3 text-xs font-black rounded-2xl flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>ایجاد چک‌لیست</span>
                  </button>
                </form>
              </div>

              {/* Danger Zone: Delete task (Manager only) */}
              {taskData.permissions?.canDelete && (
                <div className="pt-4 border-t border-gray-200 flex justify-end">
                  <button
                    type="button"
                    onClick={handleDeleteTask}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-female-normal hover:bg-female-light transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف تسک</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Timeline & Narrative Reports Tab */
            <div className="space-y-6">
              {/* Submit Append-only Report Form */}
              <form onSubmit={handleSubmitReport} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
                <label className="block text-xs font-black text-sec">ثبت گزارش کار روایی روی این تسک:</label>
                <textarea
                  rows={3}
                  required
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  placeholder="شرح کارهای انجام‌شده، چالش‌ها یا پیشرفت تسک را اینجا بنویسید (غیرقابل حذف و ویرایش)..."
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-300 focus:border-primary focus:outline-none bg-white leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReport || !reportContent.trim()}
                    className="rokad-btn-primary px-5 py-2.5 text-xs font-black rounded-xl flex items-center gap-2 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingReport ? "در حال ثبت..." : "ثبت گزارش در تایم‌لاین"}</span>
                  </button>
                </div>
              </form>

              {/* Timeline Feed */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {timelineItems.length === 0 ? (
                  <div className="text-center py-10 text-xs sm:text-sm text-gray-400">
                    هنوز گزارش یا رویدادی روی این تسک ثبت نشده است.
                  </div>
                ) : (
                  timelineItems.map((item, idx) => {
                    if (item.type === "report") {
                      return (
                        <div
                          key={`rep-${item.id}`}
                          className="p-4 rounded-2xl bg-ecosystem-light/50 border border-primary/20 space-y-2 text-xs sm:text-sm"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-black text-sec flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-primary" />
                              <span>{item.authorName} ({item.authorDepartment || "پسرانه"})</span>
                            </span>
                            <span className="text-ink-normal/50 font-mono">
                              {formatTehranTime(item.createdAt)} • {formatToJalali(item.createdAt)}
                            </span>
                          </div>
                          <p className="text-ink-darker font-medium leading-relaxed whitespace-pre-wrap">
                            {item.content}
                          </p>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={`act-${item.id}`}
                          className="p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between text-xs text-ink-normal/70"
                        >
                          <div className="flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-college-normal" />
                            <span>
                              <strong className="text-sec">{item.actorName}</strong>:{" "}
                              {item.actionType === "created"
                                ? "تسک را ایجاد کرد."
                                : item.actionType === "moved_column"
                                ? `تسک را به ستون «${item.metadata?.toColumnName || "جدید"}» منتقل کرد.`
                                : item.actionType === "checklist_item_checked"
                                ? `آیتم «${item.metadata?.itemTitle || ""}» را ${item.metadata?.isDone ? "تیک زد." : "تیکش را برداشت."}`
                                : item.actionType === "edited"
                                ? `فیلدهای (${item.metadata?.changedFields?.join("، ") || "مشخصات"}) را ویرایش کرد.`
                                : "رویداد سیستمی ثبت شد."}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono text-gray-400">
                            {formatTehranTime(item.createdAt)}
                          </span>
                        </div>
                      );
                    }
                  })
                )}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}
