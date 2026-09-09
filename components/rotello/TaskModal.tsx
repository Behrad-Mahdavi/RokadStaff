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
  isAdmin?: boolean;
}

export default function TaskModal({
  taskId,
  isOpen,
  onClose,
  onTaskUpdated,
  projectMembers = [],
  boardColumns = [],
  isAdmin,
}: TaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [taskData, setTaskData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"details" | "timeline">("details");
  const [sessionUser, setSessionUser] = useState<any>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");
  const [deadline, setDeadline] = useState("");
  const [columnId, setColumnId] = useState("");
  const [status, setStatus] = useState("todo");

  // Assignees
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [organizationEmployees, setOrganizationEmployees] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setSessionUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const effectiveIsAdmin =
    isAdmin !== undefined
      ? isAdmin
      : sessionUser?.role === "admin" || sessionUser?.role === "supervisor";

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
        setColumnId(json.task.columnId || "");
        setStatus(json.task.status || "todo");
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
  const updateTaskField = async (fields: {
    title?: string;
    description?: string;
    priority?: string;
    deadline?: string | null;
    columnId?: string;
  }) => {
    if (!taskId) return;
    try {
      const res = await fetch(`/api/rotello/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      if (res.ok) {
        if (onTaskUpdated) onTaskUpdated();
      }
    } catch (err) {
      console.error("Field update error:", err);
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
          <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-3 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === "details"
                  ? "bg-ecosystem-light dark:bg-ecosystem-darker/60 text-ecosystem-darker dark:text-ecosystem-light border border-primary/30 shadow-sm"
                  : "text-ink-normal/60 dark:text-gray-400 hover:text-ink-normal dark:hover:text-white"
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>مشخصات و چک‌لیست‌ها</span>
            </button>

            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shrink-0 whitespace-nowrap ${
                activeTab === "timeline"
                  ? "bg-ecosystem-light dark:bg-ecosystem-darker/60 text-ecosystem-darker dark:text-ecosystem-light border border-primary/30 shadow-sm"
                  : "text-ink-normal/60 dark:text-gray-400 hover:text-ink-normal dark:hover:text-white"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>تاریخچه گزارش‌ها و رویدادها ({toPersianDigits(timelineItems.length)})</span>
            </button>
          </div>

          {activeTab === "details" ? (
            <div className="space-y-6">
              {/* Task Title & Description */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-ink-normal/60 dark:text-gray-400 mb-1">عنوان وظیفه:</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => updateTaskField({ title })}
                    className="w-full text-base sm:text-lg font-black text-sec dark:text-white p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161D2A] focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-normal/60 dark:text-gray-400 mb-1">توضیحات تکمیلی:</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => updateTaskField({ description })}
                    placeholder="شرح جزئیات یا نیازمندی‌های این وظیفه..."
                    className="w-full text-xs sm:text-sm font-medium text-ink-darker dark:text-gray-200 p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161D2A] focus:border-primary focus:outline-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Meta Grid (Column, Priority, Deadline) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 p-4 bg-gray-50 dark:bg-[#161D2A] rounded-2xl border border-gray-200 dark:border-gray-700">
                {/* Column (for Project Tasks) or Status (for Individual Tasks) */}
                <div>
                  {taskData.task.projectId ? (
                    <>
                      <label className="block text-xs font-bold text-ink-normal/60 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        <span>ستون فعلی:</span>
                      </label>
                      <select
                        value={columnId}
                        onChange={(e) => {
                          const newColId = e.target.value;
                          const targetCol = boardColumns.find((c: any) => c.id === newColId);
                          if (targetCol?.isDoneColumn && !effectiveIsAdmin) {
                            alert("تنها مدیر سیستم مجاز به انتقال وظیفه به ستون انجام‌شده است.");
                            return;
                          }
                          setColumnId(newColId);
                          updateTaskField({ columnId: newColId });
                        }}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121824] focus:border-primary focus:outline-none text-sec dark:text-white"
                      >
                        {boardColumns.map((col: any) => {
                          const isLocked = col.isDoneColumn && !effectiveIsAdmin;
                          return (
                            <option key={col.id} value={col.id} disabled={isLocked} className="dark:bg-[#121824]">
                              {col.name} {col.isDoneColumn ? (isLocked ? "🔒 (فقط مدیر)" : "✅") : ""}
                            </option>
                          );
                        })}
                      </select>
                    </>
                  ) : (
                    <>
                      <label className="block text-xs font-bold text-ink-normal/60 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5 text-primary" />
                        <span>وضعیت وظیفه فردی:</span>
                      </label>
                      <select
                        value={status}
                        onChange={async (e) => {
                          const newStatus = e.target.value;
                          setStatus(newStatus);
                          await fetch(`/api/tasks/${taskId}/status`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ status: newStatus }),
                          });
                          if (onTaskUpdated) onTaskUpdated();
                        }}
                        className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121824] focus:border-primary focus:outline-none text-sec dark:text-white"
                      >
                        <option value="todo" className="dark:bg-[#121824]">برای انجام</option>
                        <option value="in_progress" className="dark:bg-[#121824]">در حال انجام</option>
                        <option value="done" className="dark:bg-[#121824]">انجام‌شده ✅</option>
                        <option value="cancelled" className="dark:bg-[#121824]">لغوشده ❌</option>
                      </select>
                    </>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-bold text-ink-normal/60 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-college-normal" />
                    <span>اولویت:</span>
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => {
                      const newPri = e.target.value;
                      setPriority(newPri);
                      updateTaskField({ priority: newPri });
                    }}
                    className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121824] focus:border-primary focus:outline-none text-sec dark:text-white"
                  >
                    <option value="normal" className="dark:bg-[#121824]">عادی</option>
                    <option value="important" className="dark:bg-[#121824]">مهم</option>
                    <option value="urgent" className="dark:bg-[#121824]">فوری</option>
                  </select>
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-xs font-bold text-ink-normal/60 dark:text-gray-400 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    <span>مهلت انجام:</span>
                  </label>
                  <PersianDatePicker
                    value={deadline}
                    onChange={(newDate) => {
                      const val = newDate?.trim() || "";
                      setDeadline(val);
                      updateTaskField({ deadline: val || null });
                    }}
                    placeholder="انتخاب مهلت..."
                  />
                </div>
              </div>

              {/* Multi-Assignees Section */}
              <div>
                <label className="block text-xs font-bold text-ink-normal/60 dark:text-gray-400 mb-2 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-primary" />
                    <span>همکاران مسئول وظیفه:</span>
                  </span>
                  <span className="text-xs text-ink-normal/50 dark:text-gray-400">
                    {toPersianDigits(taskData.assignees.length)} نفر
                  </span>
                </label>

                {/* Assigned tags */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {taskData.assignees.length === 0 ? (
                    <span className="text-xs text-gray-400 italic">هنوز کسی به این وظیفه منتسب نشده است.</span>
                  ) : (
                    taskData.assignees.map((a: any) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ecosystem-light dark:bg-ecosystem-darker/60 text-ecosystem-darker dark:text-ecosystem-light text-xs font-bold border border-primary/30"
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
                    className="w-full p-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-xs font-bold text-ink-normal/70 dark:text-gray-300 hover:border-primary flex items-center justify-between bg-white dark:bg-[#161D2A]"
                  >
                    <span>مدیریت و انتخاب همکاران مسئول...</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {isAssigneeDropdownOpen && (
                    <div className="absolute top-full right-0 left-0 mt-1 bg-white dark:bg-[#161D2A] border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg p-3 z-30 max-h-48 overflow-y-auto space-y-1">
                      {organizationEmployees.map((member: any) => {
                        const isAssigned = selectedAssignees.includes(member.employeeId);
                        return (
                          <button
                            key={member.employeeId}
                            type="button"
                            onClick={() => handleToggleAssignee(member.employeeId)}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-colors ${
                              isAssigned
                                ? "bg-ecosystem-light dark:bg-ecosystem-darker/60 text-ecosystem-darker dark:text-ecosystem-light"
                                : "hover:bg-gray-100 dark:hover:bg-gray-800 text-ink-normal/80 dark:text-gray-300"
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
              <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-sec dark:text-white flex items-center gap-2">
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
                    <div key={chk.id} className="p-4 bg-gray-50 dark:bg-[#161D2A] rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                      {/* Header & Progress */}
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-sec dark:text-white font-black text-sm">{chk.title}</span>
                        <span className="text-ink-normal/60 dark:text-gray-400">
                          {toPersianDigits(doneCount)} از {toPersianDigits(totalCount)} (٪{toPersianDigits(percent)})
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
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
                            className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white dark:hover:bg-gray-800/80 cursor-pointer transition-colors"
                          >
                            <div className="mt-0.5 text-primary">
                              {item.isDone ? (
                                <CheckSquare className="w-4 h-4 text-primary" />
                              ) : (
                                <Square className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                              )}
                            </div>
                            <div className="flex-1 text-xs sm:text-sm font-medium">
                              <span className={item.isDone ? "line-through text-ink-normal/40 dark:text-gray-500 font-normal" : "text-sec dark:text-white font-bold"}>
                                {item.title}
                              </span>
                              {item.doneByName && (
                                <div className="text-[11px] text-ink-normal/40 dark:text-gray-500 mt-0.5">
                                  {item.isDone ? "تیک‌خورده توسط" : "آخرین تعامل توسط"}: {item.doneByName}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add item input */}
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60 dark:border-gray-700/60">
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
                          className="flex-1 text-xs p-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121824] text-sec dark:text-white focus:border-primary focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddChecklistItem(chk.id)}
                          className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-primary rounded-xl text-xs font-bold text-sec dark:text-white transition-colors"
                        >
                          افزودن
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Add new checklist button / form */}
                <form
                  onSubmit={handleAddChecklist}
                  className="flex items-center gap-2 pt-2"
                >
                  <input
                    type="text"
                    value={newChecklistTitle}
                    onChange={(e) => setNewChecklistTitle(e.target.value)}
                    placeholder="عنوان مرحله جدید (مثلاً: تست نهایی، تحویل)..."
                    className="flex-1 text-xs p-2.5 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-[#161D2A] text-sec dark:text-white focus:border-primary focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rokad-btn-outline px-4 py-2.5 text-xs font-bold rounded-xl shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن مرحله</span>
                  </button>
                </form>
              </div>

              {/* Danger Zone: Delete task (Manager only) */}
              {taskData.permissions?.canDelete && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                  <button
                    type="button"
                    onClick={handleDeleteTask}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-female-normal hover:bg-female-light dark:hover:bg-female-normal/10 transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>حذف وظیفه</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Timeline & Narrative Reports Tab */
            <div className="space-y-6">
              {/* Submit Append-only Report Form */}
              <form onSubmit={handleSubmitReport} className="p-4 bg-gray-50 dark:bg-[#161D2A] rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3">
                <label className="block text-xs font-black text-sec dark:text-white">ثبت گزارش کار روایی روی این وظیفه:</label>
                <textarea
                  rows={3}
                  required
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  placeholder="شرح کارهای انجام‌شده، چالش‌ها یا پیشرفت کار را اینجا بنویسید (غیرقابل حذف و ویرایش)..."
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-300 dark:border-gray-700 focus:border-primary focus:outline-none bg-white dark:bg-[#121824] text-sec dark:text-white leading-relaxed"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingReport || !reportContent.trim()}
                    className="w-full sm:w-auto rokad-btn-primary px-5 py-2.5 text-xs font-black rounded-xl flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{submittingReport ? "در حال ثبت..." : "ثبت گزارش در تاریخچه"}</span>
                  </button>
                </div>
              </form>

              {/* Timeline Feed */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {timelineItems.length === 0 ? (
                  <div className="text-center py-10 text-xs sm:text-sm text-gray-400">
                    هنوز گزارش یا رویدادی روی این وظیفه ثبت نشده است.
                  </div>
                ) : (
                  timelineItems.map((item, idx) => {
                    if (item.type === "report") {
                      return (
                        <div
                          key={`rep-${item.id}`}
                          className="p-4 rounded-2xl bg-ecosystem-light/50 dark:bg-ecosystem-darker/40 border border-primary/20 space-y-2 text-xs sm:text-sm"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                            <span className="font-black text-sec dark:text-white flex items-center gap-1.5">
                              <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span>{item.authorName} ({item.authorDepartment || "پسرانه"})</span>
                            </span>
                            <span className="text-ink-normal/50 dark:text-gray-400 font-mono text-[11px] sm:text-xs">
                              {formatTehranTime(item.createdAt)} • {formatToJalali(item.createdAt)}
                            </span>
                          </div>
                          <p className="text-ink-darker dark:text-gray-200 font-medium leading-relaxed whitespace-pre-wrap">
                            {item.content}
                          </p>
                        </div>
                      );
                    } else {
                      return (
                        <div
                          key={`act-${item.id}`}
                          className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-ink-normal/70 dark:text-gray-300"
                        >
                          <div className="flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 text-college-normal shrink-0" />
                            <span>
                              <strong className="text-sec dark:text-white">{item.actorName}</strong>:{" "}
                              {item.actionType === "created"
                                ? "وظیفه را ایجاد کرد."
                                : item.actionType === "moved_column"
                                ? `وظیفه را به ستون «${item.metadata?.toColumnName || "جدید"}» منتقل کرد.`
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
