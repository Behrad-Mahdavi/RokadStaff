"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  Unlink,
  Edit2,
  Sparkles,
  FileText,
  Building2,
  Trash2,
  Plus,
  X,
} from "lucide-react";
import Modal from "@/components/Modal";
import { toPersianDigits } from "@/lib/utils";
import Link from "next/link";

interface DepartmentItem {
  id: string;
  name: string;
  description?: string | null;
  employeeCount?: number;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Departments state
  const [departments, setDepartments] = useState<DepartmentItem[]>([
    { id: "1", name: "پسرانه", employeeCount: 0 },
    { id: "2", name: "دخترانه", employeeCount: 0 },
  ]);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptFormName, setDeptFormName] = useState("");
  const [deptFormDesc, setDeptFormDesc] = useState("");
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [deptActionLoading, setDeptActionLoading] = useState(false);
  const [deptError, setDeptError] = useState<string | null>(null);
  const [deptSuccess, setDeptSuccess] = useState<string | null>(null);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("پسرانه");
  const [position, setPosition] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [createdCodeInfo, setCreatedCodeInfo] = useState<{ name: string; code: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (selectedDept !== "all") params.append("department", selectedDept);
      if (selectedStatus !== "all") params.append("isActive", selectedStatus);

      const res = await fetch(`/api/employees?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, selectedDept, selectedStatus]);

  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.departments) && data.departments.length > 0) {
          setDepartments(data.departments);
          if (data.departments[0]?.name) {
            setDepartment((prev) => prev || data.departments[0].name);
          }
        }
      }
    } catch (err) {
      console.error("Error loading departments:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptFormName.trim()) return;

    setDeptActionLoading(true);
    setDeptError(null);
    setDeptSuccess(null);

    try {
      if (editingDept) {
        const res = await fetch(`/api/departments/${editingDept.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: deptFormName.trim(),
            description: deptFormDesc.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setDeptError(data.error || "خطا در ویرایش دپارتمان");
        } else {
          setDeptSuccess("دپارتمان با موفقیت ویرایش شد.");
          setDeptFormName("");
          setDeptFormDesc("");
          setEditingDept(null);
          await fetchDepartments();
          await fetchEmployees();
        }
      } else {
        const res = await fetch("/api/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: deptFormName.trim(),
            description: deptFormDesc.trim(),
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setDeptError(data.error || "خطا در ایجاد دپارتمان");
        } else {
          setDeptSuccess("دپارتمان جدید با موفقیت ثبت شد.");
          setDeptFormName("");
          setDeptFormDesc("");
          await fetchDepartments();
        }
      }
    } catch (err: any) {
      setDeptError("خطا در برقراری ارتباط با سرور");
    } finally {
      setDeptActionLoading(false);
    }
  };

  const handleStartEditDept = (dept: DepartmentItem) => {
    setEditingDept(dept);
    setDeptFormName(dept.name);
    setDeptFormDesc(dept.description || "");
    setDeptError(null);
    setDeptSuccess(null);
  };

  const handleCancelEditDept = () => {
    setEditingDept(null);
    setDeptFormName("");
    setDeptFormDesc("");
    setDeptError(null);
    setDeptSuccess(null);
  };

  const handleDeleteDepartment = async (dept: DepartmentItem) => {
    if (dept.employeeCount && dept.employeeCount > 0) {
      alert(`امکان حذف دپارتمان «${dept.name}» وجود ندارد؛ زیرا ${toPersianDigits(dept.employeeCount)} همکار در این دپارتمان عضو هستند.`);
      return;
    }

    if (!confirm(`آیا از حذف دپارتمان «${dept.name}» اطمینان دارید؟`)) return;

    try {
      const res = await fetch(`/api/departments/${dept.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "خطا در حذف دپارتمان");
      } else {
        await fetchDepartments();
        await fetchEmployees();
      }
    } catch (err) {
      alert("خطا در برقراری ارتباط با سرور");
    }
  };

  // Handle Add Employee
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;

    setFormLoading(true);
    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, department, position }),
      });

      const data = await res.json();
      if (res.ok) {
        setIsAddModalOpen(false);
        setCreatedCodeInfo({
          name: data.employee.fullName,
          code: data.employee.linkCode,
        });
        setIsCodeModalOpen(true);
        setFullName("");
        setDepartment("پسرانه");
        setPosition("");
        fetchEmployees();
      } else {
        alert(data.error || "خطا در ایجاد کارمند");
      }
    } catch (err: any) {
      alert("خطا در برقراری ارتباط با سرور");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Edit Employee
  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;

    setFormLoading(true);
    try {
      const res = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: selectedEmployee.fullName,
          department: selectedEmployee.department,
          position: selectedEmployee.position,
          isActive: selectedEmployee.isActive,
        }),
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        fetchEmployees();
      } else {
        alert("خطا در ویرایش کارمند");
      }
    } catch (err) {
      alert("خطای سرور");
    } finally {
      setFormLoading(false);
    }
  };

  // Handle Regenerate Link Code
  const handleRegenerateCode = async (emp: any) => {
    if (!confirm(`آیا می‌خواهید برای ${emp.fullName} کد اتصال جدید صادر کنید؟`)) return;

    try {
      const res = await fetch(`/api/employees/${emp.id}/regenerate-link-code`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedCodeInfo({
          name: emp.fullName,
          code: data.linkCode,
        });
        setIsCodeModalOpen(true);
        fetchEmployees();
      }
    } catch (err) {
      alert("خطا در صدور مجدد کد");
    }
  };

  // Handle Unlink Telegram
  const handleUnlink = async (emp: any) => {
    if (!confirm(`آیا مطمئن هستید که می‌خواهید اتصال تلگرام ${emp.fullName} را قطع کنید؟`)) return;

    try {
      const res = await fetch(`/api/employees/${emp.id}/unlink`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedCodeInfo({
          name: emp.fullName,
          code: data.employee.linkCode,
        });
        setIsCodeModalOpen(true);
        fetchEmployees();
      }
    } catch (err) {
      alert("خطا در قطع اتصال");
    }
  };

  // Copy Telegram instructions to clipboard
  const handleCopyInvitation = (code: string, name: string) => {
    const text = `سلام ${name} گرامی 🌿\nبه سامانه روتلو خوش آمدید.\nلطفاً به ربات تلگرام پیام دهید و دستور زیر را ارسال کنید:\n\n/link ${code}\n\nسپس هر روز پایان ساعت کاری گزارش کار خود را با دستور /report ثبت نمایید.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-sec dark:text-white tracking-tight">مدیریت کارکنان</h1>
          <p className="text-xs text-ink-normal/60 dark:text-gray-400 mt-1">
            مشاهده، افزودن، صدور کد اتصال تلگرام و مدیریت دسترسی کارمندان
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setDeptError(null);
              setDeptSuccess(null);
              setEditingDept(null);
              setDeptFormName("");
              setDeptFormDesc("");
              setIsDeptModalOpen(true);
            }}
            className="px-3.5 py-2.5 text-xs rounded-xl font-bold bg-white dark:bg-[#1C2536] border border-gray-200 dark:border-gray-700 text-sec dark:text-white hover:border-primary/60 hover:text-primary transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Building2 className="w-4 h-4 text-primary" />
            <span>مدیریت دپارتمان‌ها</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="rokad-btn-primary px-4 py-2.5 text-xs rounded-xl flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>افزودن کارمند جدید</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#151C28] p-4 rounded-2xl border border-[#EAEAEA] dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="جستجوی نام کارمند..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-10 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs focus:border-primary focus:outline-none bg-[#FAFAFA] dark:bg-[#1C2536] text-ink-normal dark:text-white focus:bg-white dark:focus:bg-[#1C2536]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-2.5" />
        </div>

        {/* Department Filter */}
        <div className="w-full md:w-48">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-[#FAFAFA] dark:bg-[#1C2536] dark:text-white focus:border-primary focus:outline-none font-bold text-sec dark:text-white"
          >
            <option value="all">همه دپارتمان‌ها</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-36">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-[#FAFAFA] dark:bg-[#1C2536] dark:text-white focus:border-primary focus:outline-none font-bold text-sec dark:text-white"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="true">فعال</option>
            <option value="false">غیرفعال</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white dark:bg-[#151C28] rounded-2xl border border-[#EAEAEA] dark:border-gray-800 shadow-[3px_3px_0_#202A5A] dark:shadow-[3px_3px_0_#59BBAF] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs min-w-[650px]">
            <thead className="bg-[#F8F9FA] dark:bg-[#1C2536] border-b border-gray-200 dark:border-gray-800 text-ink-normal/70 dark:text-gray-300 font-bold">
              <tr>
                <th className="py-3.5 px-4">نام و نام خانوادگی</th>
                <th className="py-3.5 px-4">دپارتمان / سمت</th>
                <th className="py-3.5 px-4">وضعیت اتصال تلگرام</th>
                <th className="py-3.5 px-4">کد اتصال فعال</th>
                <th className="py-3.5 px-4">وضعیت حساب</th>
                <th className="py-3.5 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    در حال بارگذاری لیست کارکنان...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    هیچ کارمندی با مشخصات وارد شده یافت نشد.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-gray-50/70 dark:hover:bg-[#1C2536]/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-sec dark:text-white">
                      {emp.fullName}
                    </td>
                    <td className="py-3.5 px-4 text-ink-normal/70 dark:text-gray-300">
                      <div className="font-bold text-sec dark:text-white">{emp.department || "پسرانه"}</div>
                      <div className="text-[11px] text-ink-normal/50 dark:text-gray-400">{emp.position || "همکار"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {emp.isLinked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ecosystem-light dark:bg-ecosystem-darker/40 text-ecosystem-darker dark:text-ecosystem-light border border-primary/30 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                          متصل شد
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-college-light dark:bg-college-darker/40 text-college-darker dark:text-college-light border border-college-normal/30 font-bold text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5 text-college-normal" />
                          در انتظار اتصال
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {emp.isLinked ? (
                        <span className="text-gray-400 text-[11px]">-</span>
                      ) : emp.linkCode ? (
                        <div className="flex items-center gap-1.5 font-bold text-sec dark:text-white">
                          <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-300 dark:border-gray-700">
                            {emp.linkCode}
                          </span>
                          <button
                            onClick={() => handleCopyInvitation(emp.linkCode, emp.fullName)}
                            title="کپی متن دعوت"
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-600 dark:text-gray-300"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-[11px]">منقضی شده</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                          emp.isActive
                            ? "bg-accent-green/10 text-accent-green"
                            : "bg-accent-red/10 text-accent-red"
                        }`}
                      >
                        {emp.isActive ? "فعال" : "غیرفعال"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link
                          href={`/reports/employee/${emp.id}`}
                          title="مشاهده کارنامه جامع عملکرد"
                          className="p-1.5 text-gray-500 hover:text-primary hover:bg-ecosystem-light dark:hover:bg-ecosystem-darker/50 rounded-lg transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                        </Link>
                        {emp.isLinked ? (
                          <button
                            onClick={() => handleUnlink(emp)}
                            title="قطع اتصال تلگرام"
                            className="p-1.5 text-gray-500 hover:text-female-normal hover:bg-female-light dark:hover:bg-female-darker/50 rounded-lg transition-colors"
                          >
                            <Unlink className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRegenerateCode(emp)}
                            title="صدور مجدد کد ۶ رقمی"
                            className="p-1.5 text-gray-500 hover:text-primary hover:bg-ecosystem-light dark:hover:bg-ecosystem-darker/50 rounded-lg transition-colors"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setIsEditModalOpen(true);
                          }}
                          title="ویرایش مشخصات"
                          className="p-1.5 text-gray-500 hover:text-sec dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Add Employee */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="ثبت کارمند جدید در سامانه"
      >
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">نام و نام خانوادگی *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: علی رضایی"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-sec dark:text-gray-200">دپارتمان *</label>
              <button
                type="button"
                onClick={() => {
                  setDeptError(null);
                  setDeptSuccess(null);
                  setEditingDept(null);
                  setDeptFormName("");
                  setDeptFormDesc("");
                  setIsDeptModalOpen(true);
                }}
                className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1"
              >
                + مدیریت دپارتمان‌ها
              </button>
            </div>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none font-bold text-sec dark:text-white bg-white dark:bg-[#1C2536]"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">سمت شغلی</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="مثال: معاون، دبیر، مربی"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold hover:bg-gray-50 dark:hover:bg-[#1C2536] dark:text-gray-300"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="rokad-btn-primary px-5 py-2 text-xs rounded-xl"
            >
              {formLoading ? "در حال ثبت..." : "تأیید و صدور کد اتصال"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Edit Employee */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="ویرایش مشخصات کارمند"
      >
        {selectedEmployee && (
          <form onSubmit={handleEditEmployee} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">نام و نام خانوادگی</label>
              <input
                type="text"
                required
                value={selectedEmployee.fullName}
                onChange={(e) => setSelectedEmployee({ ...selectedEmployee, fullName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-sec dark:text-gray-200">دپارتمان</label>
                <button
                  type="button"
                  onClick={() => {
                    setDeptError(null);
                    setDeptSuccess(null);
                    setEditingDept(null);
                    setDeptFormName("");
                    setDeptFormDesc("");
                    setIsDeptModalOpen(true);
                  }}
                  className="text-[11px] text-primary hover:underline font-bold flex items-center gap-1"
                >
                  + مدیریت دپارتمان‌ها
                </button>
              </div>
              <select
                value={selectedEmployee.department || departments[0]?.name || "پسرانه"}
                onChange={(e) => setSelectedEmployee({ ...selectedEmployee, department: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none font-bold text-sec dark:text-white bg-white dark:bg-[#1C2536]"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">سمت شغلی</label>
              <input
                type="text"
                value={selectedEmployee.position || ""}
                onChange={(e) => setSelectedEmployee({ ...selectedEmployee, position: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActiveCheck"
                checked={selectedEmployee.isActive}
                onChange={(e) => setSelectedEmployee({ ...selectedEmployee, isActive: e.target.checked })}
                className="w-4 h-4 text-primary rounded"
              />
              <label htmlFor="isActiveCheck" className="text-xs font-bold text-sec dark:text-gray-200 cursor-pointer">
                حساب کاربری فعال است
              </label>
            </div>

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold hover:bg-gray-50 dark:hover:bg-[#1C2536] dark:text-gray-300"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={formLoading}
                className="rokad-btn-primary px-5 py-2 text-xs rounded-xl"
              >
                {formLoading ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal 3: Show Generated Code */}
      <Modal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        title="کد اتصال تلگرام صادر شد 🎉"
      >
        {createdCodeInfo && (
          <div className="space-y-4 text-center">
            <div className="p-4 rounded-2xl bg-ecosystem-light dark:bg-ecosystem-darker/40 border border-primary/30">
              <div className="text-xs text-ink-normal/70 dark:text-gray-300 mb-1">
                کد یکبارمصرف ۶ رقمی برای {createdCodeInfo.name}:
              </div>
              <div className="text-3xl font-black font-mono tracking-widest text-sec dark:text-white my-2">
                {createdCodeInfo.code}
              </div>
              <div className="text-[11px] text-ink-normal/50 dark:text-gray-400">
                این کد تا ۲۴ ساعت آینده معتبر است.
              </div>
            </div>

            <div className="text-right bg-gray-50 dark:bg-[#1C2536] p-3 rounded-xl border border-gray-200 dark:border-gray-800 text-xs text-ink-normal/80 dark:text-gray-300 space-y-1">
              <div className="font-bold text-sec dark:text-white">راهنمای کارمند:</div>
              <div>۱. ورود به ربات تلگرام روتلو</div>
              <div>۲. ارسال دستور: <code className="font-mono bg-white dark:bg-[#151C28] dark:text-gray-200 px-1 py-0.5 border dark:border-gray-700 rounded">/link {createdCodeInfo.code}</code></div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleCopyInvitation(createdCodeInfo.code, createdCodeInfo.name)}
                className="w-full rokad-btn-primary py-2.5 text-xs rounded-xl flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>متن پیام کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>کپی پیام آماده جهت ارسال به کارمند</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal 4: Manage Departments */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => {
          setIsDeptModalOpen(false);
          handleCancelEditDept();
        }}
        title="مدیریت دپارتمان‌های سازمان"
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Create / Edit Form */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#1C2536] border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black text-sec dark:text-white flex items-center gap-1.5">
                {editingDept ? (
                  <>
                    <Edit2 className="w-3.5 h-3.5 text-primary" />
                    <span>ویرایش دپارتمان: {editingDept.name}</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5 text-primary" />
                    <span>افزودن دپارتمان جدید</span>
                  </>
                )}
              </h4>
              {editingDept && (
                <button
                  type="button"
                  onClick={handleCancelEditDept}
                  className="text-[11px] text-gray-500 hover:text-red-500 font-bold flex items-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>انصراف از ویرایش</span>
                </button>
              )}
            </div>

            <form onSubmit={handleSaveDepartment} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-sec dark:text-gray-300 mb-1">
                    نام دپارتمان *
                  </label>
                  <input
                    type="text"
                    required
                    value={deptFormName}
                    onChange={(e) => setDeptFormName(e.target.value)}
                    placeholder="مثال: آموزش، اداری و مالی، روابط عمومی..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#151C28] dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-sec dark:text-gray-300 mb-1">
                    توضیحات (اختیاری)
                  </label>
                  <input
                    type="text"
                    value={deptFormDesc}
                    onChange={(e) => setDeptFormDesc(e.target.value)}
                    placeholder="توضیحات مختصری درباره این دپارتمان..."
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#151C28] dark:text-white"
                  />
                </div>
              </div>

              {deptError && (
                <div className="text-[11px] font-bold text-accent-red bg-accent-red/10 p-2 rounded-lg flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{deptError}</span>
                </div>
              )}

              {deptSuccess && (
                <div className="text-[11px] font-bold text-accent-green bg-accent-green/10 p-2 rounded-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{deptSuccess}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={deptActionLoading || !deptFormName.trim()}
                  className="rokad-btn-primary px-4 py-2 text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-50"
                >
                  {deptActionLoading ? (
                    <span>در حال ذخیره...</span>
                  ) : editingDept ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>ذخیره تغییرات دپارتمان</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن دپارتمان</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Department List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-ink-normal/70 dark:text-gray-400">
                فهرست دپارتمان‌های فعال ({toPersianDigits(departments.length)})
              </span>
              <span className="text-[11px] text-ink-normal/50 dark:text-gray-500">
                با ویرایش نام، نام بخش برای تمامی اعضای آن نیز به‌روز می‌شود.
              </span>
            </div>

            <div className="divide-y divide-gray-100 dark:divide-gray-800 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-[#151C28]">
              {departments.length === 0 ? (
                <div className="p-6 text-center text-gray-400 text-xs">
                  دپارتمانی ثبت نشده است.
                </div>
              ) : (
                departments.map((dept) => (
                  <div
                    key={dept.id}
                    className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                      editingDept?.id === dept.id
                        ? "bg-primary/5 dark:bg-primary/10 border-r-4 border-r-primary"
                        : "hover:bg-gray-50/70 dark:hover:bg-[#1C2536]/50"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-sec dark:text-white">
                          {dept.name}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-ecosystem-light dark:bg-ecosystem-darker/50 text-ecosystem-darker dark:text-ecosystem-light border border-primary/30">
                          <Users className="w-3 h-3 text-primary" />
                          {toPersianDigits(dept.employeeCount || 0)} همکار
                        </span>
                      </div>
                      {dept.description && (
                        <p className="text-[11px] text-ink-normal/60 dark:text-gray-400">
                          {dept.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        onClick={() => handleStartEditDept(dept)}
                        title="ویرایش نام و مشخصات دپارتمان"
                        className="px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-bold text-sec dark:text-gray-200 hover:text-primary hover:border-primary/50 transition-colors flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>ویرایش</span>
                      </button>

                      <button
                        onClick={() => handleDeleteDepartment(dept)}
                        disabled={!!(dept.employeeCount && dept.employeeCount > 0)}
                        title={
                          dept.employeeCount && dept.employeeCount > 0
                            ? "به دلیل وجود کارمند در این دپارتمان امکان حذف نیست"
                            : "حذف دپارتمان"
                        }
                        className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-colors flex items-center gap-1 ${
                          dept.employeeCount && dept.employeeCount > 0
                            ? "border-gray-200 dark:border-gray-800 text-gray-400 cursor-not-allowed opacity-60"
                            : "border-gray-200 dark:border-gray-700 text-accent-red hover:bg-accent-red/10 hover:border-accent-red/40"
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
