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
  UserPlus,
  Trash2,
  ShieldCheck,
  Pencil,
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

  // Create Task Modal in Board
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskColId, setNewTaskColId] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("normal");
  const [newTaskDeadline, setNewTaskDeadline] = useState("");
  const [newTaskAssignees, setNewTaskAssignees] = useState<string[]>([]);
  const [creatingTask, setCreatingTask] = useState(false);
  const [createTaskError, setCreateTaskError] = useState("");

  // New Column Modal
  const [isNewColModalOpen, setIsNewColModalOpen] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColIsDone, setNewColIsDone] = useState(false);

  // Members Management Modal
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);
  const [selectedEmpToAdd, setSelectedEmpToAdd] = useState("");
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState("member");

  // Edit Project Modal
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDesc, setEditProjectDesc] = useState("");
  const [updatingProject, setUpdatingProject] = useState(false);
  const [editProjectError, setEditProjectError] = useState("");

  // Delete Project Modal
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [deleteProjectError, setDeleteProjectError] = useState("");

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

  // Handle Open & Submit Create Task Modal
  const handleOpenCreateTaskModal = (colId?: string) => {
    setNewTaskTitle("");
    setNewTaskDesc("");
    setNewTaskPriority("normal");
    setNewTaskDeadline("");
    setNewTaskAssignees([]);
    setCreateTaskError("");
    setNewTaskColId(colId || (columns.length > 0 ? columns[0].id : ""));
    setIsCreateTaskModalOpen(true);
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      setCreateTaskError("عنوان وظیفه الزامی است.");
      return;
    }

    setCreatingTask(true);
    setCreateTaskError("");
    try {
      const res = await fetch("/api/rotello/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          columnId: newTaskColId || (columns.length > 0 ? columns[0].id : undefined),
          title: newTaskTitle.trim(),
          description: newTaskDesc.trim() || null,
          priority: newTaskPriority,
          deadline: newTaskDeadline || null,
          assigneeIds: newTaskAssignees,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsCreateTaskModalOpen(false);
        fetchBoard();
      } else {
        setCreateTaskError(data.error || "خطا در ایجاد وظیفه");
      }
    } catch (err) {
      setCreateTaskError("خطای شبکه یا ارتباط با سرور");
    } finally {
      setCreatingTask(false);
    }
  };

  // Handle Edit Project
  const handleOpenEditProject = () => {
    setEditProjectName(project?.name || "");
    setEditProjectDesc(project?.description || "");
    setEditProjectError("");
    setIsEditProjectOpen(true);
  };

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProjectName.trim()) return;

    setUpdatingProject(true);
    setEditProjectError("");
    try {
      const res = await fetch(`/api/rotello/projects/${projectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editProjectName.trim(),
          description: editProjectDesc.trim() || null,
        }),
      });

      if (res.ok) {
        setIsEditProjectOpen(false);
        fetchBoard();
      } else {
        const data = await res.json().catch(() => ({}));
        setEditProjectError(data.error || "خطا در ویرایش پروژه");
      }
    } catch (err) {
      console.error(err);
      setEditProjectError("خطای ارتباط با سرور رخ داد.");
    } finally {
      setUpdatingProject(false);
    }
  };

  // Handle Delete Project
  const handleDeleteProject = async () => {
    setDeletingProject(true);
    setDeleteProjectError("");
    try {
      const res = await fetch(`/api/rotello/projects/${projectId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/rotello/projects");
      } else {
        const data = await res.json().catch(() => ({}));
        setDeleteProjectError(data.error || "خطا در حذف پروژه");
      }
    } catch (err) {
      console.error(err);
      setDeleteProjectError("خطای ارتباط با سرور رخ داد.");
    } finally {
      setDeletingProject(false);
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

    // Check if target column is a Done column and user is not admin
    const targetCol = boardData?.columns?.find((c: any) => c.id === targetColId);
    if (targetCol?.isDoneColumn && !boardData?.isAdmin) {
      alert("تنها مدیر سیستم مجاز به انتقال تسک به ستون انجام‌شده است.");
      setDraggedTaskId(null);
      return;
    }

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
      const res = await fetch(`/api/rotello/tasks/${draggedTaskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          columnId: targetColId,
          position: lastPos,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        alert(errJson.error || "خطا در انتقال تسک");
        fetchBoard();
        return;
      }

      fetchBoard();
    } catch (err) {
      console.error(err);
      fetchBoard();
    }
  };

  if (loading && !boardData) {
    return (
      <div className="space-y-6">
        <div className="h-12 w-64 bg-gray-200 animate-pulse rounded-2xl" />
        <div className="flex gap-5 overflow-x-auto pb-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-80 h-[500px] bg-white rounded-2xl border animate-pulse shrink-0 p-5" />
          ))}
        </div>
      </div>
    );
  }

  const project = boardData?.project;
  const columns = boardData?.columns || [];
  const tasks = boardData?.tasks || [];
  const members = boardData?.members || [];
  const isManager = Boolean(boardData?.isAdmin) || boardData?.userRole === "manager" || boardData?.userRole === "owner" || !boardData?.userRole;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Board Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#151C28] p-5 sm:p-6 rounded-2xl border border-[#EAEAEA] dark:border-gray-800 shadow-[3px_3px_0_#202A5A] dark:shadow-[3px_3px_0_#59BBAF]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/rotello/projects"
              className="text-xs font-bold text-ink-normal/60 dark:text-gray-400 hover:text-primary transition-colors flex items-center gap-1"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>بازگشت به پروژه‌ها</span>
            </Link>
            <span className="text-gray-300 dark:text-gray-700">•</span>
            <span className="text-xs font-black text-primary px-2 py-0.5 bg-ecosystem-light dark:bg-ecosystem-darker/60 rounded-full">
              بورد پروژه
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-sec dark:text-white">{project?.name}</h1>
          {project?.description && (
            <p className="text-xs sm:text-sm text-ink-normal/60 dark:text-gray-400 mt-0.5 font-medium">{project.description}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Create Task Button */}
          <button
            onClick={() => handleOpenCreateTaskModal()}
            className="rokad-btn-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-[2px_2px_0_#202A5A] dark:shadow-[2px_2px_0_#59BBAF]"
          >
            <Plus className="w-4 h-4" />
            <span>وظیفه جدید</span>
          </button>

          {/* Members Avatars Button */}
          <button
            onClick={() => setIsMembersModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold text-sec dark:text-gray-200 flex items-center gap-2 transition-colors"
          >
            <Users className="w-4 h-4 text-primary" />
            <span>اعضای پروژه ({toPersianDigits(members.length)})</span>
          </button>

          {/* Add Column Button (Manager only) */}
          {isManager && (
            <>
              <button
                onClick={() => setIsNewColModalOpen(true)}
                className="rokad-btn-outline px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>افزودن ستون</span>
              </button>

              <button
                onClick={handleOpenEditProject}
                className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold text-sec dark:text-gray-200 flex items-center gap-1.5 transition-colors"
                title="ویرایش مشخصات پروژه"
              >
                <Pencil className="w-4 h-4 text-primary" />
                <span className="hidden sm:inline">ویرایش</span>
              </button>

              <button
                onClick={() => {
                  setDeleteProjectError("");
                  setIsDeleteProjectOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/60 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5 transition-colors"
                title="حذف کامل پروژه"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">حذف</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Kanban Board Columns Horizontal Layout */}
      <div className="flex items-start gap-4 sm:gap-5 overflow-x-auto pb-8 pt-2 min-h-[calc(100vh-280px)] overscroll-x-contain touch-pan-x">
        {columns.map((column: any) => {
          const colTasks = tasks.filter((t: any) => t.columnId === column.id);

          return (
            <div
              key={column.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDropOnColumn(column.id)}
              className="w-[85vw] sm:w-80 md:w-84 shrink-0 bg-[#F7F9F9] dark:bg-[#161D2A] rounded-2xl border border-gray-200/80 dark:border-gray-800 p-4 flex flex-col max-h-[calc(100vh-260px)] shadow-sm"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-200 dark:border-gray-800 px-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-sec dark:text-white">{column.name}</span>
                  {column.isDoneColumn && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-green/10 text-accent-green border border-accent-green/20">
                      <span>✅</span>
                      <span>تکمیل‌شده</span>
                      {!boardData?.isAdmin && (
                        <span className="text-ink-normal/50 dark:text-gray-400 text-[9px] mr-0.5">(فقط مدیر)</span>
                      )}
                    </span>
                  )}
                  <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 text-ink-normal/70 dark:text-gray-300 text-[11px] font-bold flex items-center justify-center">
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
                      className="bg-white dark:bg-[#1C2536] p-4 rounded-2xl border border-gray-200/90 dark:border-gray-700 hover:border-primary hover:shadow-[3px_3px_0_#59BBAF] transition-all cursor-pointer space-y-3 group select-none"
                    >
                      {/* Priority & Overdue tags */}
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                            task.priority === "urgent"
                              ? "bg-female-light dark:bg-female-darker/60 text-female-darker dark:text-female-light border-female-normal/30"
                              : task.priority === "important"
                              ? "bg-college-light dark:bg-college-darker/60 text-college-darker dark:text-college-light border-college-normal/30"
                              : "bg-gray-100 dark:bg-gray-800 text-ink-normal/70 dark:text-gray-300 border-gray-200 dark:border-gray-700"
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
                      <h4 className="text-xs sm:text-sm font-black text-sec dark:text-white group-hover:text-primary transition-colors leading-snug">
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
                      <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px] text-ink-normal/60 dark:text-gray-400 font-medium">
                        {/* Assignee chips */}
                        <div className="flex items-center -space-x-1 space-x-reverse">
                          {task.assignees.length === 0 ? (
                            <span className="text-gray-400 dark:text-gray-500 text-[10px]">بدون مسئول</span>
                          ) : (
                            task.assignees.slice(0, 3).map((a: any) => (
                              <div
                                key={a.employeeId}
                                title={a.fullName}
                                className="w-6 h-6 rounded-full bg-ecosystem-light dark:bg-ecosystem-darker/70 border border-white dark:border-gray-700 text-ecosystem-darker dark:text-ecosystem-light text-[10px] font-black flex items-center justify-center shadow-xs"
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

              {/* Add Task in Column (Opens Popup Modal) */}
              <div className="pt-3 mt-2 border-t border-gray-200/60 dark:border-gray-800">
                {column.isDoneColumn && !boardData?.isAdmin ? (
                  <div className="py-2 text-center text-[11px] font-bold text-ink-normal/40 dark:text-gray-400 bg-gray-100/60 dark:bg-gray-800/40 rounded-xl">
                    تکمیل تسک تنها توسط مدیر مجاز است
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenCreateTaskModal(column.id)}
                    className="w-full py-2 px-3 rounded-xl hover:bg-white dark:hover:bg-[#1C2536] text-xs font-bold text-ink-normal/70 dark:text-gray-300 hover:text-sec dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
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

      {/* Modal: Create New Task in Board */}
      <Modal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        title={`ایجاد وظیفه جدید: ${project?.name || ""}`}
        maxWidth="md"
      >
        <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
          {createTaskError && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl border border-red-200 dark:border-red-800/50 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{createTaskError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-gray-200 mb-1.5">
              عنوان وظیفه <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="مثال: طراحی پروتوتایپ صفحه نخست..."
              className="w-full text-xs font-bold p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121824] text-slate-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-200 mb-1.5">
                ستون قرارگیری
              </label>
              <select
                value={newTaskColId}
                onChange={(e) => setNewTaskColId(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121824] text-slate-900 dark:text-white focus:border-primary focus:outline-none"
              >
                {columns.map((col: any) => (
                  <option key={col.id} value={col.id} className="bg-white dark:bg-[#121824] text-slate-900 dark:text-white">
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-200 mb-1.5">
                سطح اولویت
              </label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121824] text-slate-900 dark:text-white focus:border-primary focus:outline-none"
              >
                <option value="normal" className="bg-white dark:bg-[#121824] text-slate-900 dark:text-white">عادی (Normal)</option>
                <option value="important" className="bg-white dark:bg-[#121824] text-slate-900 dark:text-white">مهم (Important)</option>
                <option value="urgent" className="bg-white dark:bg-[#121824] text-slate-900 dark:text-white">فوری (Urgent)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-200 mb-1.5">
              مهلت انجام (ددلاین)
            </label>
            <input
              type="date"
              value={newTaskDeadline}
              onChange={(e) => setNewTaskDeadline(e.target.value)}
              className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121824] text-slate-900 dark:text-white focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-gray-200 mb-1.5">
              توضیحات و شرح کار
            </label>
            <textarea
              value={newTaskDesc}
              onChange={(e) => setNewTaskDesc(e.target.value)}
              rows={3}
              placeholder="شرح اهداف، جزئیات و نیازمندی‌های این وظیفه..."
              className="w-full text-xs font-medium p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121824] text-slate-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:border-primary focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Assignees selection */}
          {members.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-gray-200 mb-1.5">
                تخصیص به همکاران پروژه:
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 dark:bg-[#121824] rounded-xl border border-gray-200 dark:border-gray-700">
                {members.map((m: any) => {
                  const isSelected = newTaskAssignees.includes(m.employeeId);
                  return (
                    <button
                      key={m.employeeId}
                      type="button"
                      onClick={() => {
                        setNewTaskAssignees((prev) =>
                          prev.includes(m.employeeId)
                            ? prev.filter((id) => id !== m.employeeId)
                            : [...prev, m.employeeId]
                        );
                      }}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-white dark:bg-[#192131] text-slate-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-primary/50"
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                        {m.fullName ? m.fullName.slice(0, 1) : "?"}
                      </div>
                      <span>{m.fullName}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsCreateTaskModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={creatingTask || !newTaskTitle.trim()}
              className="rokad-btn-primary px-5 py-2.5 text-xs font-black rounded-xl disabled:opacity-50 flex items-center gap-1.5 shadow-[2px_2px_0_#202A5A] dark:shadow-[2px_2px_0_#59BBAF]"
            >
              {creatingTask ? (
                <span>در حال ثبت...</span>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>ثبت وظیفه جدید</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Task Details Modal */}
      <TaskModal
        taskId={selectedTaskId}
        isOpen={!!selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onTaskUpdated={fetchBoard}
        projectMembers={members}
        boardColumns={columns}
        isAdmin={Boolean(boardData?.isAdmin)}
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
            <label className="block text-xs font-black text-sec dark:text-white mb-1">نام ستون:</label>
            <input
              type="text"
              required
              placeholder="مثال: در انتظار تأیید کارفرما"
              value={newColName}
              onChange={(e) => setNewColName(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1C2536] text-ink-normal dark:text-white focus:border-primary focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer p-3 bg-gray-50 dark:bg-[#1C2536] rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-sec dark:text-gray-200">
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
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Add member form (Manager only) */}
          {isManager && (
            <div className="p-5 bg-gradient-to-b from-gray-50 to-white dark:from-[#192131] dark:to-[#141A26] rounded-2xl border border-gray-200/90 dark:border-gray-700/80 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                <div className="w-8 h-8 rounded-xl bg-primary/15 dark:bg-primary/25 text-primary flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-sec dark:text-white">
                    افزودن همکار جدید به این پروژه
                  </h4>
                  <p className="text-[11px] text-ink-normal/60 dark:text-gray-400">
                    همکار مورد نظر و سطح دسترسی او در این پروژه را مشخص کنید.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddMember} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                      انتخاب همکار:
                    </label>
                    <select
                      value={selectedEmpToAdd}
                      onChange={(e) => setSelectedEmpToAdd(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121824] text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                    >
                      <option value="" className="bg-white dark:bg-[#121824] text-slate-900 dark:text-white">انتخاب همکار...</option>
                      {allEmployees.map((emp: any) => (
                        <option
                          key={emp.id}
                          value={emp.id}
                          className="bg-white dark:bg-[#121824] text-slate-900 dark:text-white"
                        >
                          {emp.fullName} ({emp.department || "پسرانه"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-gray-300 mb-1.5">
                      نقش و سطح دسترسی:
                    </label>
                    <select
                      value={selectedRoleToAdd}
                      onChange={(e) => setSelectedRoleToAdd(e.target.value)}
                      className="w-full text-xs font-bold p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121824] text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-colors"
                    >
                      <option value="member" className="bg-white dark:bg-[#121824] text-slate-900 dark:text-white">عضو مجری (دسترسی عادی)</option>
                      <option value="manager" className="bg-white dark:bg-[#121824] text-slate-900 dark:text-white">مدیر پروژه (دسترسی کامل)</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    disabled={!selectedEmpToAdd}
                    className="rokad-btn-primary px-5 py-2.5 text-xs font-black rounded-xl shrink-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[2px_2px_0_#202A5A] dark:shadow-[2px_2px_0_#59BBAF]"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>افزودن به پروژه</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Members list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <h4 className="text-xs sm:text-sm font-black text-sec dark:text-white">
                  اعضای فعال این پروژه
                </h4>
              </div>
              <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20">
                {toPersianDigits(members.length)} همکار
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-0.5">
              {members.length === 0 ? (
                <div className="p-6 text-center text-xs font-bold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-[#151C28] rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                  هنوز عضوی به این پروژه تخصیص داده نشده است.
                </div>
              ) : (
                members.map((m: any) => {
                  const isProjManager = m.role === "manager" || m.role === "owner";
                  return (
                    <div
                      key={m.employeeId}
                      className="p-3.5 bg-white dark:bg-[#192131] hover:bg-gray-50/80 dark:hover:bg-[#1C2538] rounded-2xl border border-gray-200/80 dark:border-gray-700/70 flex items-center justify-between transition-colors shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/25 to-sec/20 text-primary dark:text-secondary font-black flex items-center justify-center text-sm border border-primary/20 shrink-0">
                          {m.fullName ? m.fullName.slice(0, 1) : "?"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-black text-sec dark:text-white">
                              {m.fullName}
                            </span>
                            {isProjManager ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                <ShieldCheck className="w-3 h-3" />
                                <span>مدیر پروژه</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                عضو مجری
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-ink-normal/50 dark:text-gray-400 mt-0.5 font-medium">
                            بخش: {m.department || "پسرانه"}
                          </div>
                        </div>
                      </div>

                      {isManager && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(m.employeeId)}
                          className="flex items-center gap-1 text-rose-500 hover:text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50"
                          title="حذف از پروژه"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">حذف</span>
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Edit Project Modal */}
      <Modal
        isOpen={isEditProjectOpen}
        onClose={() => {
          setIsEditProjectOpen(false);
          setEditProjectError("");
        }}
        title="ویرایش مشخصات پروژه"
        maxWidth="md"
      >
        <form onSubmit={handleUpdateProject} className="space-y-4">
          {editProjectError && (
            <div className="p-3.5 bg-female-light dark:bg-female-darker/40 border border-female-normal/30 rounded-2xl text-xs font-bold text-female-darker dark:text-female-light">
              ⚠️ {editProjectError}
            </div>
          )}

          <div>
            <label className="block text-xs font-black text-sec dark:text-white mb-1.5">نام پروژه:</label>
            <input
              type="text"
              required
              value={editProjectName}
              onChange={(e) => setEditProjectName(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1C2536] text-ink-normal dark:text-white focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-sec dark:text-white mb-1.5">توضیحات (اختیاری):</label>
            <textarea
              rows={3}
              value={editProjectDesc}
              onChange={(e) => setEditProjectDesc(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-2xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1C2536] text-ink-normal dark:text-white focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditProjectOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={updatingProject || !editProjectName.trim()}
              className="rokad-btn-primary px-5 py-2.5 text-xs font-black rounded-xl shadow-sm"
            >
              {updatingProject ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Project Confirmation Modal */}
      <Modal
        isOpen={isDeleteProjectOpen}
        onClose={() => {
          setIsDeleteProjectOpen(false);
          setDeleteProjectError("");
        }}
        title="حذف کامل پروژه"
        maxWidth="sm"
      >
        <div className="space-y-4">
          {deleteProjectError && (
            <div className="p-3.5 bg-female-light dark:bg-female-darker/40 border border-female-normal/30 rounded-2xl text-xs font-bold text-female-darker dark:text-female-light">
              ⚠️ {deleteProjectError}
            </div>
          )}

          <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-2xl text-xs sm:text-sm text-red-700 dark:text-red-300 leading-relaxed font-medium">
            آیا از حذف پروژه <span className="font-black text-red-900 dark:text-red-100">«{project?.name}»</span> اطمینان دارید؟
            <br />
            تمامی ستون‌ها، وظایف و اعضای منتسب به این بورد به‌طور دائمی حذف خواهند شد و به صفحه لیست پروژه‌ها منتقل خواهید شد.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={deletingProject}
              onClick={() => setIsDeleteProjectOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
            >
              انصراف
            </button>
            <button
              type="button"
              disabled={deletingProject}
              onClick={handleDeleteProject}
              className="px-5 py-2.5 text-xs font-black rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-[2px_2px_0_#991B1B] transition-all disabled:opacity-50"
            >
              {deletingProject ? "در حال حذف..." : "بله، حذف پروژه"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
