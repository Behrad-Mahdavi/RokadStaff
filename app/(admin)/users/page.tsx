"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Shield,
  UserPlus,
  Users,
  Search,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Trash2,
  KeyRound,
  Building2,
  Mail,
  Lock,
  User,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import Modal from "@/components/Modal";
import { toPersianDigits, formatToJalali } from "@/lib/utils";

interface AdminUserItem {
  id: string;
  email: string;
  fullName: string;
  role: "admin" | "supervisor";
  assignedDepartment?: string | null;
  createdAt: string;
  updatedAt?: string;
}

interface DepartmentItem {
  id: string;
  name: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);

  // Form states - Add User
  const [addFullName, setAddFullName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPassword, setAddPassword] = useState("");
  const [addRole, setAddRole] = useState<"admin" | "supervisor">("supervisor");
  const [addDepartment, setAddDepartment] = useState("");
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Form states - Edit User
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "supervisor">("supervisor");
  const [editDepartment, setEditDepartment] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Form states - Reset Password
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, deptsRes, meRes] = await Promise.all([
        fetch("/api/admin-users"),
        fetch("/api/departments"),
        fetch("/api/auth/me"),
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }

      if (deptsRes.ok) {
        const data = await deptsRes.json();
        setDepartments(data.departments || []);
        if (data.departments?.length > 0 && !addDepartment) {
          setAddDepartment(data.departments[0].name);
        }
      }

      if (meRes.ok) {
        const data = await meRes.json();
        if (data.user?.userId || data.user?.id) {
          setCurrentAdminId(data.user.userId || data.user.id);
        }
      }
    } catch (err) {
      console.error("Error loading users data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !search ||
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.assignedDepartment && u.assignedDepartment.includes(search));

    const matchRole =
      selectedRoleFilter === "all" || u.role === selectedRoleFilter;

    return matchSearch && matchRole;
  });

  // Handle Add User
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!addEmail.trim() || !addEmail.includes("@")) {
      setAddError("لطفاً یک آدرس ایمیل معتبر وارد کنید.");
      return;
    }

    if (!addPassword || addPassword.length < 6) {
      setAddError("کلمه عبور باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    if (addRole === "supervisor" && !addDepartment) {
      setAddError("برای نقش سرپرست، انتخاب دپارتمان الزامی است.");
      return;
    }

    setAddLoading(true);
    try {
      const res = await fetch("/api/admin-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: addFullName.trim() || undefined,
          email: addEmail.trim(),
          password: addPassword,
          role: addRole,
          assignedDepartment: addRole === "supervisor" ? addDepartment : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || "خطا در ثبت کاربر");
      } else {
        setIsAddModalOpen(false);
        setAddFullName("");
        setAddEmail("");
        setAddPassword("");
        setAddRole("supervisor");
        await fetchData();
      }
    } catch (err) {
      setAddError("خطا در برقراری ارتباط با سرور");
    } finally {
      setAddLoading(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (user: AdminUserItem) => {
    setSelectedUser(user);
    setEditFullName(user.fullName);
    setEditEmail(user.email);
    setEditRole(user.role);
    setEditDepartment(user.assignedDepartment || (departments[0]?.name || "پسرانه"));
    setEditError(null);
    setIsEditModalOpen(true);
  };

  // Handle Save Edit User
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditError(null);

    if (!editEmail.trim() || !editEmail.includes("@")) {
      setEditError("لطفاً یک ایمیل معتبر وارد کنید.");
      return;
    }

    if (editRole === "supervisor" && !editDepartment) {
      setEditError("برای نقش سرپرست، انتخاب دپارتمان الزامی است.");
      return;
    }

    setEditLoading(true);
    try {
      const res = await fetch(`/api/admin-users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: editFullName.trim(),
          email: editEmail.trim(),
          role: editRole,
          assignedDepartment: editRole === "supervisor" ? editDepartment : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error || "خطا در ویرایش اطلاعات");
      } else {
        setIsEditModalOpen(false);
        await fetchData();
      }
    } catch (err) {
      setEditError("خطا در برقراری ارتباط با سرور");
    } finally {
      setEditLoading(false);
    }
  };

  // Open Password Modal
  const handleOpenPassword = (user: AdminUserItem) => {
    setSelectedUser(user);
    setResetNewPassword("");
    setResetConfirmPassword("");
    setResetError(null);
    setIsPasswordModalOpen(true);
  };

  // Handle Save Reset Password
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setResetError(null);

    if (resetNewPassword.length < 6) {
      setResetError("رمز عبور جدید باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError("تکرار رمز عبور جدید مطابقت ندارد.");
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch(`/api/admin-users/${selectedUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPassword: resetNewPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || "خطا در تنظیم کلمه عبور");
      } else {
        alert(`کلمه عبور جدید برای کاربر «${selectedUser.fullName}» با موفقیت تنظیم شد.`);
        setIsPasswordModalOpen(false);
      }
    } catch (err) {
      setResetError("خطا در برقراری ارتباط با سرور");
    } finally {
      setResetLoading(false);
    }
  };

  // Handle Delete User
  const handleDeleteUser = async (user: AdminUserItem) => {
    if (user.id === currentAdminId) {
      alert("امکان حذف حساب کاربری خودتان وجود ندارد.");
      return;
    }

    if (!confirm(`آیا مطمئن هستید که می‌خواهید دسترسی کاربر «${user.fullName}» را حذف کنید؟`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin-users/${user.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "خطا در حذف کاربر");
      } else {
        await fetchData();
      }
    } catch (err) {
      alert("خطا در برقراری ارتباط با سرور");
    }
  };

  const adminCount = users.filter((u) => u.role === "admin").length;
  const supervisorCount = users.filter((u) => u.role === "supervisor").length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-sec dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span>کاربران و سطوح دسترسی</span>
          </h1>
          <p className="text-xs text-ink-normal/60 dark:text-gray-400 mt-1">
            مدیریت حساب‌های مدیریتی، تعیین سطح دسترسی (مدیر ارشد یا سرپرست دپارتمان) و تخصیص بخش‌ها
          </p>
        </div>

        <button
          onClick={() => {
            setAddError(null);
            setAddFullName("");
            setAddEmail("");
            setAddPassword("");
            setAddRole("supervisor");
            setIsAddModalOpen(true);
          }}
          className="rokad-btn-primary px-4 py-2.5 text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>افزودن کاربر با سطح دسترسی</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#151C28] p-4 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-ink-normal/60 dark:text-gray-400 font-bold">کل کاربران مدیریتی</div>
            <div className="text-2xl font-black text-sec dark:text-white mt-1">
              {toPersianDigits(users.length)} نفر
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-800 text-sec dark:text-white flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#151C28] p-4 rounded-2xl border border-primary/20 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-primary font-bold">مدیران ارشد (Admin)</div>
            <div className="text-2xl font-black text-sec dark:text-white mt-1">
              {toPersianDigits(adminCount)} نفر
            </div>
            <div className="text-[10px] text-ink-normal/50 dark:text-gray-400 mt-0.5">دسترسی کامل به کل سازمان</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-ecosystem-light dark:bg-ecosystem-darker/60 text-primary flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-[#151C28] p-4 rounded-2xl border border-blue-500/20 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-sec dark:text-blue-400 font-bold">سرپرستان دپارتمان (Supervisor)</div>
            <div className="text-2xl font-black text-sec dark:text-white mt-1">
              {toPersianDigits(supervisorCount)} نفر
            </div>
            <div className="text-[10px] text-ink-normal/50 dark:text-gray-400 mt-0.5">محدود به دپارتمان اختصاصی</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#151C28] p-4 rounded-2xl border border-[#EAEAEA] dark:border-gray-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            placeholder="جستجوی نام، ایمیل یا دپارتمان کاربر..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-10 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs focus:border-primary focus:outline-none bg-[#FAFAFA] dark:bg-[#1C2536] text-ink-normal dark:text-white"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-2.5" />
        </div>

        <div className="w-full md:w-48">
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-[#FAFAFA] dark:bg-[#1C2536] font-bold text-sec dark:text-white focus:border-primary focus:outline-none"
          >
            <option value="all">همه سطوح دسترسی</option>
            <option value="admin">فقط مدیران ارشد</option>
            <option value="supervisor">فقط سرپرستان دپارتمان</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-[#151C28] rounded-2xl border border-[#EAEAEA] dark:border-gray-800 shadow-[3px_3px_0_#202A5A] dark:shadow-[3px_3px_0_#59BBAF] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs min-w-[700px]">
            <thead className="bg-[#F8F9FA] dark:bg-[#1C2536] border-b border-gray-200 dark:border-gray-800 text-ink-normal/70 dark:text-gray-300 font-bold">
              <tr>
                <th className="py-3.5 px-4">کاربر</th>
                <th className="py-3.5 px-4">ایمیل ورود</th>
                <th className="py-3.5 px-4">سطح دسترسی (نقش)</th>
                <th className="py-3.5 px-4">دپارتمان مجاز</th>
                <th className="py-3.5 px-4">تاریخ ثبت</th>
                <th className="py-3.5 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    در حال بارگذاری کاربران سیستم...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-400">
                    کاربری با شرایط انتخابی یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrent = u.id === currentAdminId;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/70 dark:hover:bg-[#1C2536]/50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-sec dark:text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-ecosystem-dark text-white flex items-center justify-center font-black text-xs shrink-0">
                            {u.fullName ? u.fullName.slice(0, 1) : "ک"}
                          </div>
                          <div>
                            <span className="font-bold">{u.fullName}</span>
                            {isCurrent && (
                              <span className="mr-1.5 text-[10px] px-1.5 py-0.5 rounded bg-ecosystem-light dark:bg-ecosystem-darker/60 text-primary font-bold">
                                حساب شما
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-ink-normal/80 dark:text-gray-300 text-[11px]" dir="ltr">
                        {u.email}
                      </td>

                      <td className="py-3.5 px-4">
                        {u.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-ecosystem-light dark:bg-ecosystem-darker/50 text-ecosystem-darker dark:text-ecosystem-light border border-primary/30 font-bold text-[11px]">
                            <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                            مدیر ارشد (Admin)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-400/30 font-bold text-[11px]">
                            <Shield className="w-3.5 h-3.5 text-blue-500" />
                            سرپرست (Supervisor)
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-ink-normal/70 dark:text-gray-300 font-bold">
                        {u.role === "admin" ? (
                          <span className="text-gray-500 text-[11px]">کل سازمان (نامحدود)</span>
                        ) : (
                          <span className="text-sec dark:text-white text-xs">
                            دپارتمان {u.assignedDepartment || "نامشخص"}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-[11px] text-ink-normal/50 dark:text-gray-400">
                        {formatToJalali(new Date(u.createdAt))}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            title="ویرایش سطح دسترسی و مشخصات"
                            className="p-1.5 text-gray-500 hover:text-sec dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenPassword(u)}
                            title="تغییر کلمه عبور کاربر"
                            className="p-1.5 text-gray-500 hover:text-primary hover:bg-ecosystem-light dark:hover:bg-ecosystem-darker/50 rounded-lg transition-colors"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={isCurrent}
                            title={isCurrent ? "نمی‌توانید حساب کاربری خودتان را حذف کنید" : "حذف دسترسی کاربر"}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isCurrent
                                ? "text-gray-300 dark:text-gray-700 cursor-not-allowed"
                                : "text-gray-500 hover:text-accent-red hover:bg-accent-red/10"
                            }`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Add User */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="ثبت کاربر با سطح دسترسی"
        maxWidth="md"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">
              نام و نام خانوادگی
            </label>
            <div className="relative">
              <input
                type="text"
                value={addFullName}
                onChange={(e) => setAddFullName(e.target.value)}
                placeholder="مثال: سارا محمدی"
                className="w-full pl-3 pr-10 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
              />
              <User className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">
              ایمیل ورود به سامانه *
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="user@rokad.ir"
                className="w-full pl-3 pr-10 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white text-left font-mono"
                dir="ltr"
              />
              <Mail className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">
              کلمه عبور اولیه *
            </label>
            <div className="relative">
              <input
                type={showAddPassword ? "text" : "password"}
                required
                value={addPassword}
                onChange={(e) => setAddPassword(e.target.value)}
                placeholder="حداقل ۶ کاراکتر"
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowAddPassword(!showAddPassword)}
                className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">
              سطح دسترسی (نقش) *
            </label>
            <select
              value={addRole}
              onChange={(e) => setAddRole(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none font-bold text-sec dark:text-white bg-white dark:bg-[#1C2536]"
            >
              <option value="supervisor">سرپرست دپارتمان (Supervisor) - دسترسی به دپارتمان مشخص</option>
              <option value="admin">مدیر ارشد (Admin) - دسترسی نامحدود به کل سازمان</option>
            </select>
          </div>

          {addRole === "supervisor" && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 space-y-2">
              <label className="block text-xs font-bold text-sec dark:text-gray-200 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-500" />
                <span>دپارتمان تحت نظارت سرپرست *</span>
              </label>
              <select
                value={addDepartment}
                onChange={(e) => setAddDepartment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none font-bold text-sec dark:text-white bg-white dark:bg-[#1C2536]"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-blue-700 dark:text-blue-300">
                این کاربر تنها گزارش‌ها و پرسنل این دپارتمان را در پنل مشاهده خواهد کرد.
              </p>
            </div>
          )}

          {addError && (
            <div className="p-2.5 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{addError}</span>
            </div>
          )}

          <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-sec dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={addLoading}
              className="rokad-btn-primary px-5 py-2 text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-50"
            >
              {addLoading ? "در حال ثبت..." : "تأیید و ایجاد کاربر"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Edit User */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="ویرایش سطح دسترسی و مشخصات کاربر"
        maxWidth="md"
      >
        {selectedUser && (
          <form onSubmit={handleSaveEdit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">
                نام و نام خانوادگی
              </label>
              <input
                type="text"
                required
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">
                ایمیل ورود
              </label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white text-left font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">
                سطح دسترسی (نقش)
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as any)}
                disabled={selectedUser.id === currentAdminId}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none font-bold text-sec dark:text-white bg-white dark:bg-[#1C2536] disabled:opacity-60"
              >
                <option value="supervisor">سرپرست دپارتمان (Supervisor)</option>
                <option value="admin">مدیر ارشد (Admin)</option>
              </select>
              {selectedUser.id === currentAdminId && (
                <p className="text-[10px] text-gray-400 mt-1">امکان تغییر نقش حساب کاربری خودتان وجود ندارد.</p>
              )}
            </div>

            {editRole === "supervisor" && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 space-y-2">
                <label className="block text-xs font-bold text-sec dark:text-gray-200 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span>دپارتمان تحت نظارت سرپرست *</span>
                </label>
                <select
                  value={editDepartment}
                  onChange={(e) => setEditDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none font-bold text-sec dark:text-white bg-white dark:bg-[#1C2536]"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {editError && (
              <div className="p-2.5 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-sec dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="rokad-btn-primary px-5 py-2 text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-50"
              >
                {editLoading ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal 3: Reset Password */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={`تنظیم رمز عبور برای ${selectedUser?.fullName || "کاربر"}`}
        maxWidth="sm"
      >
        {selectedUser && (
          <form onSubmit={handleSavePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">
                کلمه عبور جدید
              </label>
              <div className="relative">
                <input
                  type={showResetPassword ? "text" : "password"}
                  required
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="حداقل ۶ کاراکتر"
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">
                تکرار کلمه عبور جدید
              </label>
              <input
                type="password"
                required
                value={resetConfirmPassword}
                onChange={(e) => setResetConfirmPassword(e.target.value)}
                placeholder="تکرار رمز عبور جدید"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
              />
            </div>

            {resetError && (
              <div className="p-2.5 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{resetError}</span>
              </div>
            )}

            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-sec dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={resetLoading}
                className="rokad-btn-primary px-5 py-2 text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-50"
              >
                {resetLoading ? "در حال ثبت..." : "تنظیم رمز عبور"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
