"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Kanban,
  Plus,
  Users,
  Settings,
  Calendar,
  AlertCircle,
  CheckSquare,
  User,
  ArrowRight,
  MoreVertical,
  Clock,
  Sparkles,
  Archive,
} from "lucide-react";
import Link from "next/link";
import Modal from "@/components/Modal";
import TaskModal from "@/components/rotello/TaskModal";
import { formatToJalali, formatTehranTime, toPersianDigits } from "@/lib/utils";

export default function ProjectBoardPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [boardData, setBoardData] = useState<any>(null);

  // Active task for detail modal
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Quick Task Create in column
  const [quickTaskColId, setQuickTaskColId] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  // New Column Modal
  const [isNewColModalOpen, setIsNewColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColIsDone, setNewColIsDone] = useState(false);

  // Members Management Modal
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [selectedEmpToAdd, setSelectedEmpToAdd] = useState("");
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState("member");

  // Drag & Drop State
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const fetchBoard = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/rotello/projects/${projectId}`);
      if (res.ok) {
        const json = await res.json();
        setBoardData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      if (res.ok) {
        const json = await res.json();
        setAllEmployees(json.employees || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchBoard();
      fetchAllEmployees();
    }
  }, [projectId]);

  // Handle Quick Task Submit
  const handleQuickTaskSubmit = async (colId: string) => {
    if (!quickTaskTitle.trim()) return;

    setCreatingTask(true);
    try {
      const res = await fetch("/api/rotello/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          columnId: colId,
          title: quickTaskTitle.trim(),
        }),
      });

      if (res.ok) {
        setQuickTaskTitle("");
        setQuickTaskColId(null);
        fetchBoard();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingTask(false);
    }
  };

  // Handle Add Column
  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;

    try {
      const res = await fetch(`/api/rotello/projects/${projectId}/columns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newColName.trim(),
          isDoneColumn: newColIsDone,
        }),
      });

      if (res.ok) {
        setNewColName("");
        setNewColIsDone(false);
        setIsNewColModalOpen(false);
        fetchBoard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpToAdd) return;

    try {
      const res = await fetch(`/api/rotello/projects/${projectId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmpToAdd,
          role: selectedRoleToAdd,
        }),
      });

      if (res.ok) {
        setSelectedEmpToAdd("");
        fetchBoard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Remove Member
  const handleRemoveMember = async (employeeId: string) => {
    if (!confirm("آیا از حذف این عضو اطمینان دارید؟")) return;
    try {
      const res = await fetch(
        `/api/rotello/projects/${projectId}/members?employeeId=${employeeId}`,
        { method: "DELETE" }
      );
      if (res.ok) fetchBoard();
    } catch (err) {
      console.error(err);
    }
  };

  // Drag & Drop Handlers (Fractional Indexing)
  const handleDragStart = (taskId: string) => {
    setDraggedTaskId(taskId);
  };

  const handleDropOnColumn = async (targetColId: string) => {
    if (!draggedTaskId) return;

    const currentTask = boardData?.tasks?.find((t: any) => t.id === draggedTaskId);
    if (!currentTask) return;

    // Calculate new position in target column
    const targetColTasks = boardData?.tasks?.filter(
      (t: any) => t.columnId === targetColId && t.id !== draggedTaskId
    ) || [];

    const lastPos =
      targetColTasks.length > 0
        ? targetColTasks[targetColTasks.length - 1].position + 1000
        : 1000;

    // Optimistic UI update
    setBoardData((prev: any) => ({
      ...prev,
      tasks: prev.tasks.map((t: any) =>
        t.id === draggedTaskId
          ? { ...t, columnId: targetColId, position: lastPos }
          : t
      ),
    }));

    setDraggedTaskId(null);

    // Call API
    try {
      await fetch(`/api/rotello/tasks/${draggedTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnId: targetColId,
          position: lastPos,
        }),
      });
      fetchBoard();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading && !boardData) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-gray-200 animate-pulse rounded-2xl" />
        <div className="flex gap-5 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-80 h-[500px] bg-white rounded-3xl border animate-pulse shrink-0 p-5" />
          ))}
        </div>
      </div>
    );
  }

  const project = boardData?.project;
  const columns = boardData?.columns || [];
  const tasks = boardData?.tasks || [];
  const members = boardData?.members || [];
  const isManager = boardData?.userRole === "manager" || boardData?.userRole === "owner";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Board Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/rotello/projects"
              className="text-xs font-bold text-ink-normal/60 hover:text-primary transition-colors flex items-center gap-1"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>بازگشت به پروژه‌ها</span>
            </Link>
            <span className="text-gray-300">•</span>
            <span className="text-xs font-black text-primary px-2 py-0.5 bg-ecosystem-light rounded-full">
              بورد کانبان
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-sec">{project?.name}</h1>
          {project?.description && (
            <p className="text-xs sm:text-sm text-ink-normal/60 mt-0.5 font-medium">{project.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Members Avatars Button */}
          <button
            onClick={() => setIsMembersModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs font-bold text-sec flex items-center gap-2 transition-colors"
          >
            <Users className="w-4 h-4 text-primary" />
            <span>اعضای پروژه ({toPersianDigits(members.length)})</span>
          </button>

          {/* Add Column Button (Manager only) */}
          {isManager && (
            <button
              onClick={() => setIsNewColModalOpen(true)}
              className="rokad-btn-outline px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن ستون</span>
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board Columns Horizontal Layout */}
      <div className="flex items-start gap-5 overflow-x-auto pb-8 pt-2 min-h-[calc(100vh-280px)]">
        {columns.map((column: any) => {
          const colTasks = tasks.filter((t: any) => t.columnId === column.id);

          return (
            <div
              key={column.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDropOnColumn(column.id)}
              className="w-80 sm:w-84 shrink-0 bg-[#F7F9F9] rounded-3xl border border-gray-200/80 p-4 flex flex-col max-h-[calc(100vh-260px)] shadow-sm"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200 px-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-sec">{column.name}</span>
                  {column.isDoneColumn && <span className="text-xs">✅</span>}
                  <span className="w-5 h-5 rounded-full bg-gray-200 text-ink-normal/70 text-[11px] font-bold flex items-center justify-center">
                    {toPersianDigits(colTasks.length)}
                  </span>
                </div>
              </div>

              {/* Task Cards Container */}
              <div className="flex-1 overflow-y-auto space-y-3 p-1">
                {colTasks.map((task: any) => {
                  const isOverdue =
                    task.deadline &&
                    !column.isDoneColumn &&
                    new Date(task.deadline) < new Date();

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="bg-white p-4 rounded-2xl border border-gray-200/90 hover:border-primary hover:shadow-[3px_3px_0_#59BBAF] transition-all cursor-pointer space-y-3 group select-none"
                    >
                      {/* Priority & Overdue tags */}
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            task.priority === "urgent"
                              ? "bg-female-light text-female-darker border-female-normal/30"
                              : task.priority === "important"
                              ? "bg-college-light text-college-darker border-college-normal/30"
                              : "bg-gray-100 text-ink-normal/70 border-gray-200"
                          }`}
                        >
                          {task.priority === "urgent"
                            ? "فوری"
                            : task.priority === "important"
                            ? "مهم"
                            : "عادی"}
                        </span>

                        {isOverdue && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>معوقه</span>
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h4 className="text-xs sm:text-sm font-black text-sec group-hover:text-primary transition-colors leading-snug">
                        {task.title}
                      </h4>

                      {/* Checklist Progress Bar */}
                      {task.progress && task.progress.total > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-ink-normal/60">
                            <span className="flex items-center gap-1">
                              <CheckSquare className="w-3 h-3 text-primary" />
                              <span>چک‌لیست</span>
                            </span>
                            <span>
                              {toPersianDigits(task.progress.done)}/{toPersianDigits(task.progress.total)} (٪
                              {toPersianDigits(task.progress.rate)})
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${task.progress.rate}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Footer: Assignees & Deadline */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-ink-normal/60 font-medium">
                        {/* Assignee chips */}
                        <div className="flex items-center -space-x-1 space-x-reverse">
                          {task.assignees.length === 0 ? (
                            <span className="text-gray-300 text-[10px]">بدون مسئول</span>
                          ) : (
                            task.assignees.slice(0, 3).map((a: any) => (
                              <div
                                key={a.employeeId}
                                title={a.fullName}
                                className="w-6 h-6 rounded-full bg-ecosystem-light border border-white text-ecosystem-darker text-[10px] font-black flex items-center justify-center shadow-xs"
                              >
                                {a.fullName.slice(0, 1)}
                              </div>
                            ))
                          )}
                          {task.assignees.length > 3 && (
                            <span className="text-[10px] pr-1">+{toPersianDigits(task.assignees.length - 3)}</span>
                          )}
                        </div>

                        {/* Deadline */}
                        {task.deadline && (
                          <div className="flex items-center gap-1 text-[10px] font-bold">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>{formatToJalali(task.deadline)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Add Task in Column */}
              <div className="pt-3 mt-2 border-t border-gray-200/60">
                {quickTaskColId === column.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      autoFocus
                      placeholder="عنوان تسک جدید..."
                      value={quickTaskTitle}
                      onChange={(e) => setQuickTaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleQuickTaskSubmit(column.id);
                        if (e.key === "Escape") setQuickTaskColId(null);
                      }}
                      className="w-full text-xs p-2.5 rounded-xl border border-primary bg-white focus:outline-none"
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setQuickTaskColId(null)}
                        className="px-2.5 py-1 text-xs text-gray-500 rounded-lg hover:bg-gray-200"
                      >
                        انصراف
                      </button>
                      <button
                        onClick={() => handleQuickTaskSubmit(column.id)}
                        disabled={creatingTask || !quickTaskTitle.trim()}
                        className="rokad-btn-primary px-3 py-1 text-xs font-bold rounded-lg"
                      >
                        افزودن
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setQuickTaskColId(column.id);
                      setQuickTaskTitle("");
                    }}
                    className="w-full py-2 px-3 rounded-xl hover:bg-white text-xs font-bold text-ink-normal/70 hover:text-sec flex items-center justify-center gap-1.5 transition-colors border border-transparent hover:border-gray-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>افزودن تسک</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Details Modal */}
      <TaskModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={fetchBoard}
        projectMembers={members}
        boardColumns={columns}
      />

      {/* Modal: Add Column */}
      <Modal
        isOpen={isNewColModalOpen}
        onClose={() => setIsNewColModalOpen(false)}
        title="افزودن ستون جدید به بورد کانبان"
        maxWidth="sm"
      >
        <form onSubmit={handleAddColumn} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-sec mb-1">نام ستون:</label>
            <input
              type="text"
              required
              placeholder="مثال: در انتظار تأیید کارفرما"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-300 focus:border-primary focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs font-bold text-sec">
            <input
              type="checkbox"
              checked={newColIsDone}
              onChange={(e) => setNewColIsDone(e.target.checked)}
              className="w-4 h-4 text-primary rounded"
            />
            <span>این ستون نشان‌دهنده «تکمیل نهایی تسک» است (Done Column)</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewColModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-gray-500 rounded-xl hover:bg-gray-100"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={!newColName.trim()}
              className="rokad-btn-primary px-5 py-2 text-xs font-black rounded-xl"
            >
              ایجاد ستون
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Project Members Management */}
      <Modal
        isOpen={isMembersModalOpen}
        onClose={() => setIsMembersModalOpen(false)}
        title={`مدیریت اعضای پروژه: ${project?.name || ""}`}
        maxWidth="md"
      >
        <div className="space-y-6">
          {/* Add member form (Manager only) */}
          {isManager && (
            <form onSubmit={handleAddMember} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
              <label className="block text-xs font-black text-sec">افزودن همکار به این پروژه:</label>
              <div className="flex flex-col sm:flex-row gap-2">
                <select
                  value={selectedEmpToAdd}
                  onChange={(e) => setSelectedEmpToAdd(e.target.value)}
                  className="flex-1 text-xs font-bold p-2.5 rounded-xl border border-gray-200 bg-white focus:border-primary focus:outline-none"
                >
                  <option value="">انتخاب همکار...</option>
                  {allEmployees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.fullName} ({emp.department || "پسرانه"})
                    </option>
                  ))}
                </select>

                <select
                  value={selectedRoleToAdd}
                  onChange={(e) => setSelectedRoleToAdd(e.target.value)}
                  className="text-xs font-bold p-2.5 rounded-xl border border-gray-200 bg-white focus:border-primary focus:outline-none"
                >
                  <option value="member">عضو مجری (Member)</option>
                  <option value="manager">مدیر پروژه (Manager)</option>
                </select>

                <button
                  type="submit"
                  disabled={!selectedEmpToAdd}
                  className="rokad-btn-primary px-4 py-2.5 text-xs font-black rounded-xl shrink-0"
                >
                  افزودن
                </button>
              </div>
            </form>
          )}

          {/* Members list */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-ink-normal/60">لیست اعضای فعلی:</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {members.map((m: any) => (
                <div
                  key={m.employeeId}
                  className="p-3 bg-white rounded-2xl border border-gray-200 flex items-center justify-between text-xs font-bold"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-ecosystem-light text-ecosystem-darker font-black flex items-center justify-center text-xs">
                      {m.fullName.slice(0, 1)}
                    </div>
                    <div>
                      <div className="text-sec font-black">{m.fullName}</div>
                      <div className="text-[11px] text-ink-normal/50">
                        {m.department || "پسرانه"} • {m.role === "manager" ? "مدیر پروژه" : "عضو مجری"}
                      </div>
                    </div>
                  </div>

                  {isManager && members.length > 1 && (
                    <button
                      onClick={() => handleRemoveMember(m.employeeId)}
                      className="text-female-normal hover:bg-female-light px-2.5 py-1 rounded-lg text-xs"
                    >
                      حذف از پروژه
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
