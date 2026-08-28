"use client";

import React, { useState, useEffect } from "react";
import {
  Kanban,
  Plus,
  Users,
  CheckCircle2,
  Layers,
  ArrowLeft,
  Sparkles,
  Archive,
  FolderKanban,
} from "lucide-react";
import Link from "next/link";
import Modal from "@/components/Modal";
import { formatToJalali, toPersianDigits } from "@/lib/utils";

export default function ProjectsListPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showArchived, setShowArchived] = useState(false);

  // New Project Modal
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/rotello/projects?archived=${showArchived}`);
      if (res.ok) {
        const json = await res.json();
        setProjects(json.projects || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [showArchived]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/rotello/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description }),
      });

      if (res.ok) {
        setName("");
        setDescription("");
        setIsNewProjectModalOpen(false);
        fetchProjects();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-gradient-to-r from-ecosystem-light via-white to-club-light/40 p-6 sm:p-7 rounded-3xl border-2 border-primary/20 shadow-[3px_3px_0_#59BBAF]">
        <div>
          <div className="flex items-center gap-2 text-sm font-black text-primary mb-1.5">
            <Kanban className="w-4 h-4" />
            <span>ماژول مدیریت پروژه‌ها و بورد کانبان (Rotello)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-sec tracking-tight">پروژه‌ها و بوردهای سازمانی</h1>
          <p className="text-xs sm:text-sm text-ink-normal/70 mt-1 font-medium">
            ایجاد بورد، پیگیری پیشرفت مرحله‌ای تسک‌ها و همکاری تیمی اعضا
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-4 py-3 text-xs sm:text-sm rounded-xl font-bold border transition-colors flex items-center gap-1.5 ${
              showArchived
                ? "bg-gray-200 text-sec border-gray-300"
                : "bg-white text-ink-normal/70 border-gray-200 hover:bg-gray-50"
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>{showArchived ? "عدم نمایش آرشیو" : "نمایش پروژه‌های آرشیوشده"}</span>
          </button>

          <button
            onClick={() => setIsNewProjectModalOpen(true)}
            className="rokad-btn-primary px-5 py-3 text-xs sm:text-sm rounded-xl font-bold flex items-center gap-2 shadow-[2.5px_2.5px_0_#1F413D]"
          >
            <Plus className="w-4 h-4" />
            <span>ایجاد پروژه جدید</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-white rounded-3xl border animate-pulse p-6" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-300 p-8">
          <FolderKanban className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-black text-sec">هیچ پروژه‌ای یافت نشد</h3>
          <p className="text-xs sm:text-sm text-ink-normal/60 mt-1">
            شما هنوز عضو پروژه‌ای نیستید یا پروژه‌ای تعریف نشده است. با دکمه بالا اولین پروژه را ایجاد کنید.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((proj) => (
            <Link
              key={proj.id}
              href={`/rotello/projects/${proj.id}`}
              className="bg-white p-6 sm:p-7 rounded-3xl border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A] hover:border-primary hover:shadow-[4px_4px_0_#59BBAF] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                      proj.userRole === "manager" || proj.userRole === "owner"
                        ? "bg-ecosystem-light text-ecosystem-darker"
                        : "bg-gray-100 text-ink-normal/70"
                    }`}
                  >
                    {proj.userRole === "owner"
                      ? "مالک کل"
                      : proj.userRole === "manager"
                      ? "مدیر پروژه"
                      : "عضو"}
                  </span>

                  {proj.isArchived && (
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-gray-200 text-gray-700">
                      آرشیو شده
                    </span>
                  )}
                </div>

                <h2 className="text-lg font-black text-sec group-hover:text-primary transition-colors">
                  {proj.name}
                </h2>
                <p className="text-xs sm:text-sm text-ink-normal/70 mt-1.5 line-clamp-2 leading-relaxed">
                  {proj.description || "بدون توضیحات تکمیلی"}
                </p>
              </div>

              <div className="pt-5 mt-5 border-t border-gray-100 flex items-center justify-between text-xs text-ink-normal/70 font-medium">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-primary" />
                    <span>{toPersianDigits(proj.membersCount)} عضو</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-sec" />
                    <span>{toPersianDigits(proj.activeTasksCount)} تسک</span>
                  </span>
                </div>

                <div className="flex items-center gap-1 text-primary font-bold group-hover:translate-x-[-3px] transition-transform">
                  <span>ورود به بورد</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal: Create Project */}
      <Modal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        title="ایجاد پروژه و بورد کانبان جدید"
        maxWidth="md"
      >
        <form onSubmit={handleCreateProject} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-sec mb-1.5">نام پروژه:</label>
            <input
              type="text"
              required
              placeholder="مثال: توسعه اپلیکیشن موبایل"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-2xl border border-gray-300 focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-black text-sec mb-1.5">توضیحات (اختیاری):</label>
            <textarea
              rows={3}
              placeholder="توضیحاتی درباره اهداف و دامنه این پروژه..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs sm:text-sm p-3 rounded-2xl border border-gray-300 focus:border-primary focus:outline-none"
            />
          </div>

          <div className="p-3 bg-gray-50 rounded-2xl border text-xs text-ink-normal/70 leading-relaxed">
            💡 با ایجاد پروژه، ۴ ستون پیش‌فرض کانبان (برای انجام، در حال انجام، بازبینی و انجام‌شده) به‌طور خودکار ساخته می‌شوند.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsNewProjectModalOpen(false)}
              className="px-4 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={creating || !name.trim()}
              className="rokad-btn-primary px-5 py-2.5 text-xs font-black rounded-xl shadow-sm"
            >
              {creating ? "در حال ایجاد..." : "ایجاد پروژه"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
