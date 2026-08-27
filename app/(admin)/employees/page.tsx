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
  Trash2,
  Sparkles,
  Phone,
  Send,
} from "lucide-react";
import Modal from "@/components/Modal";
import { toPersianDigits, formatToJalali } from "@/lib/utils";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Form states
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
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
        setDepartment("");
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
    const text = `سلام ${name} گرامی 🌿\nبه سامانه گزارش‌دهی رُکاد‌استاف خوش آمدید.\nلطفاً به ربات تلگرام پیام دهید و دستور زیر را ارسال کنید:\n\n/link ${code}\n\nسپس هر روز پایان ساعت کاری چک‌لیست خود را با دستور /report ثبت نمایید.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Extract unique departments for filter dropdown
  const departments = Array.from(new Set(employees.map((e) => e.department).filter(Boolean)));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-sec">مدیریت کارکنان</h1>
          <p className="text-xs text-ink-normal/60 mt-1">
            مشاهده، افزودن، صدور کد اتصال تلگرام و مدیریت دسترسی کارمندان
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="rokad-btn-primary px-4 py-2.5 text-xs rounded-xl"
        >
          <UserPlus className="w-4 h-4" />
          <span>افزودن کارمند جدید</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAEAEA] shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
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

        {/* Department Filter */}
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

        {/* Status Filter */}
        <div className="w-full md:w-36">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-[#FAFAFA] focus:border-primary focus:outline-none"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="true">فعال</option>
            <option value="false">غیرفعال</option>
          </select>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-[#F8F9FA] border-b border-gray-200 text-ink-normal/70 font-bold">
              <tr>
                <th className="py-3.5 px-4">نام و نام خانوادگی</th>
                <th className="py-3.5 px-4">دپارتمان / سمت</th>
                <th className="py-3.5 px-4">وضعیت اتصال تلگرام</th>
                <th className="py-3.5 px-4">کد اتصال فعال</th>
                <th className="py-3.5 px-4">وضعیت حساب</th>
                <th className="py-3.5 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
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
                  <tr key={emp.id} className="hover:bg-gray-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-sec">
                      {emp.fullName}
                    </td>
                    <td className="py-3.5 px-4 text-ink-normal/70">
                      <div>{emp.department || "عمومی"}</div>
                      <div className="text-[11px] text-ink-normal/50">{emp.position || "همکار"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {emp.isLinked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ecosystem-light text-ecosystem-darker border border-primary/30 font-bold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                          متصل شد
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-college-light text-college-darker border border-college-normal/30 font-bold text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5 text-college-normal" />
                          در انتظار اتصال
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {emp.isLinked ? (
                        <span className="text-gray-400 text-[11px]">-</span>
                      ) : emp.linkCode ? (
                        <div className="flex items-center gap-1.5 font-bold text-sec">
                          <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
                            {emp.linkCode}
                          </span>
                          <button
                            onClick={() => handleCopyInvitation(emp.linkCode, emp.fullName)}
                            title="کپی متن دعوت"
                            className="p-1 hover:bg-gray-200 rounded text-gray-600"
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
                        {emp.isLinked ? (
                          <button
                            onClick={() => handleUnlink(emp)}
                            title="قطع اتصال تلگرام"
                            className="p-1.5 text-gray-500 hover:text-female-normal hover:bg-female-light rounded-lg transition-colors"
                          >
                            <Unlink className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRegenerateCode(emp)}
                            title="صدور مجدد کد ۶ رقمی"
                            className="p-1.5 text-gray-500 hover:text-primary hover:bg-ecosystem-light rounded-lg transition-colors"
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
                          className="p-1.5 text-gray-500 hover:text-sec hover:bg-gray-100 rounded-lg transition-colors"
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
            <label className="block text-xs font-bold text-sec mb-1">نام و نام خانوادگی *</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: سارا محمدی"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-sec mb-1">دپارتمان</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="مثال: فنی و توسعه"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-sec mb-1">سمت شغلی</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="مثال: توسعه‌دهنده فرانت‌اند"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-primary focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold hover:bg-gray-50"
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
              <label className="block text-xs font-bold text-sec mb-1">نام و نام خانوادگی</label>
              <input
                type="text"
                required
                value={selectedEmployee.fullName}
                onChange={(e) => setSelectedEmployee({ ...selectedEmployee, fullName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sec mb-1">دپارتمان</label>
              <input
                type="text"
                value={selectedEmployee.department || ""}
                onChange={(e) => setSelectedEmployee({ ...selectedEmployee, department: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sec mb-1">سمت شغلی</label>
              <input
                type="text"
                value={selectedEmployee.position || ""}
                onChange={(e) => setSelectedEmployee({ ...selectedEmployee, position: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:border-primary focus:outline-none"
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
              <label htmlFor="isActiveCheck" className="text-xs font-bold text-sec cursor-pointer">
                حساب کاربری فعال است
              </label>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold hover:bg-gray-50"
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
            <div className="p-4 rounded-2xl bg-ecosystem-light border border-primary/30">
              <div className="text-xs text-ink-normal/70 mb-1">
                کد یکبارمصرف ۶ رقمی برای {createdCodeInfo.name}:
              </div>
              <div className="text-3xl font-black font-mono tracking-widest text-sec my-2">
                {createdCodeInfo.code}
              </div>
              <div className="text-[11px] text-ink-normal/50">
                این کد تا ۲۴ ساعت آینده معتبر است.
              </div>
            </div>

            <div className="text-right bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs text-ink-normal/80 space-y-1">
              <div className="font-bold text-sec">راهنمای کارمند:</div>
              <div>۱. ورود به ربات تلگرام رُکاد‌استاف</div>
              <div>۲. ارسال دستور: <code className="font-mono bg-white px-1 py-0.5 border rounded">/link {createdCodeInfo.code}</code></div>
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
    </div>
  );
}
