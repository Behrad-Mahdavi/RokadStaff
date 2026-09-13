"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Building2,
  Trash2,
  Plus,
  X,
  ShieldCheck,
  KeyRound,
  Mail,
  User,
  Eye,
  EyeOff,
  Filter,
} from "lucide-react";
import Modal from "@/components/Modal";
import { toPersianDigits, formatToJalali } from "@/lib/utils";

interface DepartmentItem {
  id: string;
  name: string;
  description?: string | null;
  employeeCount?: number;
}

interface CurrentUser {
  id?: string;
  fullName?: string;
  email?: string;
  role?: string;
  department?: string;
  assignedDepartment?: string;
}

export default function EmployeesPage() {
  // Current user info
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Employees data
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Departments
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptFormName, setDeptFormName] = useState("");
  const [deptFormDesc, setDeptFormDesc] = useState("");
  const [editingDept, setEditingDept] = useState<DepartmentItem | null>(null);
  const [deptActionLoading, setDeptActionLoading] = useState(false);
  const [deptError, setDeptError] = useState<string | null>(null);
  const [deptSuccess, setDeptSuccess] = useState<string | null>(null);

  // Add / Edit Employee Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Add/Edit Form Fields
  const [formFullName, setFormFullName] = useState("");
  const [formDepartment, setFormDepartment] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [formRole, setFormRole] = useState<"employee" | "supervisor" | "admin">("employee");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Quick Password Reset Modal
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordTargetEmployee, setPasswordTargetEmployee] = useState<any>(null);
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Code Created Modal & Copy State
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const [createdCodeInfo, setCreatedCodeInfo] = useState<{ name: string; code: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 1. Fetch current user session
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          if (data.user.role === "supervisor" && (data.user.assignedDepartment || data.user.department)) {
            const supDept = data.user.assignedDepartment || data.user.department;
            setSelectedDept(supDept);
            setFormDepartment(supDept);
          }
        }
      })
      .catch((err) => console.error("Fetch current user error:", err));
  }, []);

  // 2. Fetch departments
  const fetchDepartments = async () => {
    try {
      const res = await fetch("/api/departments");
      const data = await res.json();
      if (data.departments && Array.isArray(data.departments)) {
        setDepartments(data.departments);
        if (data.departments.length > 0 && !formDepartment) {
          setFormDepartment(data.departments[0].name);
        }
      }
    } catch (err) {
      console.error("Fetch departments error:", err);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  // 3. Fetch employees
  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDept !== "all") params.append("department", selectedDept);
      if (selectedStatus !== "all") params.append("isActive", selectedStatus === "active" ? "true" : "false");
      if (search) params.append("search", search);

      const res = await fetch(`/api/employees?${params.toString()}`);
      const data = await res.json();
      if (data.employees) {
        setEmployees(data.employees);
      }
    } catch (err) {
      console.error("Fetch employees error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, selectedDept, selectedStatus]);

  // Derived filtered employees by role
  const filteredEmployees = useMemo(() => {
    if (selectedRoleFilter === "all") return employees;
    return employees.filter((e) => e.role === selectedRoleFilter);
  }, [employees, selectedRoleFilter]);

  // Key stats
  const totalEmployeesCount = employees.length;
  const linkedEmployeesCount = employees.filter((e) => e.isLinked).length;
  const managersCount = employees.filter((e) => e.role === "admin" || e.role === "supervisor").length;

  const isSupervisor = currentUser?.role === "supervisor";
  const isAdmin = currentUser?.role === "admin" || !currentUser?.role;
  const supervisorDepartment = currentUser?.assignedDepartment || currentUser?.department || "";

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormFullName("");
    setFormDepartment(isSupervisor ? supervisorDepartment : departments[0]?.name || "پسرانه");
    setFormPosition("");
    setFormRole("employee");
    setFormEmail("");
    setFormPassword("");
    setFormError(null);
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (emp: any) => {
    if (isSupervisor && emp.role !== "employee") {
      alert("راهبر واحد فقط مجاز به مدیریت اعضای تیم است.");
      return;
    }
    setSelectedEmployee(emp);
    setFormFullName(emp.fullName || "");
    setFormDepartment(isSupervisor ? supervisorDepartment : emp.department || departments[0]?.name || "پسرانه");
    setFormPosition(emp.position || "");
    setFormRole(isSupervisor ? "employee" : (emp.role || "employee"));
    setFormEmail(emp.email || "");
    setFormPassword("");
    setFormError(null);
    setIsEditModalOpen(true);
  };

  // Submit Add Employee
  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formFullName.trim()) {
      setFormError("نام و نام خانوادگی کارمند الزامی است.");
      return;
    }

    if (isSupervisor && formRole !== "employee") {
      setFormError("راهبر واحد فقط مجاز به تعریف عضو تیم است.");
      return;
    }

    if (formRole === "supervisor" || formRole === "admin") {
      if (!formEmail.trim() || !formEmail.includes("@")) {
        setFormError("برای دسترسی به پنل، وارد کردن ایمیل معتبر الزامی است.");
        return;
      }
      if (!formPassword || formPassword.trim().length < 6) {
        setFormError("برای دسترسی به پنل، کلمه عبور حداقل ۶ کاراکتر الزامی است.");
        return;
      }
    }

    setFormLoading(true);
    try {
      const payload: Record<string, any> = {
        fullName: formFullName.trim(),
        department: isSupervisor ? supervisorDepartment : formDepartment,
        position: formPosition.trim() || null,
        role: formRole,
      };

      if (formRole === "supervisor" || formRole === "admin") {
        payload.email = formEmail.trim();
        payload.password = formPassword.trim();
      }

      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "خطا در ثبت همکار جدید");
      } else {
        setIsAddModalOpen(false);
        fetchEmployees();
        fetchDepartments();
        if (data.employee && data.employee.linkCode) {
          setCreatedCodeInfo({
            name: data.employee.fullName,
            code: data.employee.linkCode,
          });
          setIsCodeModalOpen(true);
        }
      }
    } catch (err) {
      setFormError("خطا در برقراری ارتباط با سرور");
    } finally {
      setFormLoading(false);
    }
  };

  // Submit Edit Employee
  const handleUpdateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    setFormError(null);

    if (!formFullName.trim()) {
      setFormError("نام و نام خانوادگی کارمند الزامی است.");
      return;
    }

    if (isSupervisor && formRole !== "employee") {
      setFormError("راهبر واحد فقط مجاز به ویرایش به عنوان عضو تیم است.");
      return;
    }

    if (formRole === "supervisor" || formRole === "admin") {
      if (!formEmail.trim() || !formEmail.includes("@")) {
        setFormError("برای دسترسی به پنل، وارد کردن ایمیل معتبر الزامی است.");
        return;
      }
      if (formPassword && formPassword.trim().length < 6) {
        setFormError("کلمه عبور جدید باید حداقل ۶ کاراکتر باشد.");
        return;
      }
    }

    setFormLoading(true);
    try {
      const payload: Record<string, any> = {
        fullName: formFullName.trim(),
        department: isSupervisor ? supervisorDepartment : formDepartment,
        position: formPosition.trim() || null,
        role: formRole,
        email: formEmail.trim() || null,
      };

      if (formPassword && formPassword.trim().length >= 6) {
        payload.password = formPassword.trim();
      }

      const res = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "خطا در ویرایش اطلاعات");
      } else {
        setIsEditModalOpen(false);
        fetchEmployees();
        fetchDepartments();
      }
    } catch (err) {
      setFormError("خطا در برقراری ارتباط با سرور");
    } finally {
      setFormLoading(false);
    }
  };

  // Open Quick Password Reset Modal
  const handleOpenPasswordModal = (emp: any) => {
    setPasswordTargetEmployee(emp);
    setResetNewPassword("");
    setResetConfirmPassword("");
    setResetError(null);
    setIsPasswordModalOpen(true);
  };

  // Submit Quick Password Reset
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordTargetEmployee) return;
    setResetError(null);

    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetError("کلمه عبور جدید باید حداقل ۶ کاراکتر باشد.");
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetError("تکرار کلمه عبور جدید مطابقت ندارد.");
      return;
    }

    setResetLoading(true);
    try {
      const res = await fetch(`/api/employees/${passwordTargetEmployee.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetNewPassword.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error || "خطا در بازنشانی رمز عبور");
      } else {
        setIsPasswordModalOpen(false);
      }
    } catch (err) {
      setResetError("خطا در برقراری ارتباط با سرور");
    } finally {
      setResetLoading(false);
    }
  };

  // Toggle Active Status
  const handleToggleActive = async (emp: any) => {
    try {
      await fetch(`/api/employees/${emp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !emp.isActive }),
      });
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  // Regenerate Link Code
  const handleRegenerateCode = async (empId: string) => {
    try {
      const res = await fetch(`/api/employees/${empId}/regenerate-link-code`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.employee) {
        fetchEmployees();
        setCreatedCodeInfo({
          name: data.employee.fullName,
          code: data.employee.linkCode,
        });
        setIsCodeModalOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Unlink Telegram
  const handleUnlink = async (empId: string) => {
    if (!confirm("آیا از قطع اتصال تلگرام این کارمند مطمئن هستید؟")) return;
    try {
      await fetch(`/api/employees/${empId}/unlink`, { method: "POST" });
      fetchEmployees();
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Employee
  const handleDeleteEmployee = async (emp: any) => {
    if (!confirm(`آیا از حذف ${emp.fullName} از سامانه مطمئن هستید؟`)) return;
    try {
      const res = await fetch(`/api/employees/${emp.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchEmployees();
        fetchDepartments();
      } else {
        const d = await res.json();
        alert(d.error || "خطا در حذف همکار");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Copy code helper
  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Department Management Operations
  const handleOpenAddDept = () => {
    setEditingDept(null);
    setDeptFormName("");
    setDeptFormDesc("");
    setDeptError(null);
    setDeptSuccess(null);
    setIsDeptModalOpen(true);
  };

  const handleOpenEditDept = (dept: DepartmentItem) => {
    setEditingDept(dept);
    setDeptFormName(dept.name);
    setDeptFormDesc(dept.description || "");
    setDeptError(null);
    setDeptSuccess(null);
    setIsDeptModalOpen(true);
  };

  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeptError(null);
    setDeptSuccess(null);

    if (!deptFormName.trim()) {
      setDeptError("نام دپارتمان الزامی است.");
      return;
    }

    setDeptActionLoading(true);
    try {
      if (editingDept) {
        const res = await fetch(`/api/departments/${editingDept.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: deptFormName.trim(), description: deptFormDesc.trim() || null }),
        });
        const data = await res.json();
        if (!res.ok) {
          setDeptError(data.error || "خطا در ویرایش دپارتمان");
        } else {
          setDeptSuccess("دپارتمان با موفقیت ویرایش شد.");
          fetchDepartments();
          fetchEmployees();
          setTimeout(() => setIsDeptModalOpen(false), 800);
        }
      } else {
        const res = await fetch("/api/departments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: deptFormName.trim(), description: deptFormDesc.trim() || null }),
        });
        const data = await res.json();
        if (!res.ok) {
          setDeptError(data.error || "خطا در ایجاد دپارتمان");
        } else {
          setDeptSuccess("دپارتمان جدید با موفقیت اضافه شد.");
          fetchDepartments();
          setTimeout(() => setIsDeptModalOpen(false), 800);
        }
      }
    } catch (err) {
      setDeptError("خطا در برقراری ارتباط با سرور");
    } finally {
      setDeptActionLoading(false);
    }
  };

  const handleDeleteDept = async (dept: DepartmentItem) => {
    if (!confirm(`آیا از حذف دپارتمان «${dept.name}» مطمئن هستید؟`)) return;
    try {
      const res = await fetch(`/api/departments/${dept.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "خطا در حذف دپارتمان");
      } else {
        fetchDepartments();
        fetchEmployees();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-sec dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-primary" />
            <span>مدیریت کارکنان</span>
            {isSupervisor && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 font-bold">
                واحد {supervisorDepartment}
              </span>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Department Management Button: Only visible to Senior Admin */}
          {isAdmin && (
            <button
              onClick={handleOpenAddDept}
              className="px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#161D2A] text-sec dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold transition-all duration-150 flex items-center gap-1.5 shadow-xs"
            >
              <Building2 className="w-4 h-4 text-primary" />
              <span>مدیریت دپارتمان‌ها</span>
            </button>
          )}

          {/* Add Employee Button */}
          <button
            onClick={handleOpenAddModal}
            className="rokad-btn-primary px-4 py-2.5 text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
          >
            <UserPlus className="w-4 h-4" />
            <span>افزودن همکار جدید</span>
          </button>
        </div>
      </div>

      {/* 2. KPI Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rokad-card p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-ink-normal/60 dark:text-gray-400">کل همکاران</div>
            <div className="text-xl sm:text-2xl font-black text-sec dark:text-white mt-1">
              {toPersianDigits(totalEmployeesCount)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="rokad-card p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-ink-normal/60 dark:text-gray-400">متصل به تلگرام</div>
            <div className="text-xl sm:text-2xl font-black text-sec dark:text-white mt-1">
              {toPersianDigits(linkedEmployeesCount)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-accent-green/10 text-accent-green flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="rokad-card p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-ink-normal/60 dark:text-gray-400">راهبران و مدیران</div>
            <div className="text-xl sm:text-2xl font-black text-sec dark:text-white mt-1">
              {toPersianDigits(managersCount)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="rokad-card p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-ink-normal/60 dark:text-gray-400">دپارتمان‌ها</div>
            <div className="text-xl sm:text-2xl font-black text-sec dark:text-white mt-1">
              {toPersianDigits(departments.length)}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Search and Filters Bar */}
      <div className="p-3.5 bg-white dark:bg-[#151C28] rounded-2xl border border-gray-200 dark:border-[#242F42] shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجوی نام، سمت یا ایمیل..."
            className="w-full pl-3 pr-9 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1C2536] text-xs font-bold text-sec dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors"
          />
          <Search className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Department Filter: Disabled / locked if supervisor */}
          {!isSupervisor && (
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1C2536] text-xs font-bold text-sec dark:text-gray-200 focus:outline-none focus:border-primary"
            >
              <option value="all">تمام دپارتمان‌ها</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          )}

          {/* Access Level / Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1C2536] text-xs font-bold text-sec dark:text-gray-200 focus:outline-none focus:border-primary"
          >
            <option value="all">تمام سطوح دسترسی</option>
            <option value="admin">راهبر ارشد</option>
            <option value="supervisor">راهبر واحد</option>
            <option value="employee">عضو تیم</option>
          </select>

          {/* Telegram Connection Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-[#1C2536] text-xs font-bold text-sec dark:text-gray-200 focus:outline-none focus:border-primary"
          >
            <option value="all">تمام وضعیت‌ها</option>
            <option value="active">فقط فعال</option>
            <option value="inactive">فقط غیرفعال</option>
          </select>
        </div>
      </div>

      {/* 4. Employees Table */}
      <div className="bg-white dark:bg-[#151C28] rounded-2xl border border-gray-200 dark:border-[#242F42] shadow-sm dark:shadow-[0_4px_20px_rgba(0,0,0,0.25)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-[#242F42] bg-[#F8F9FA] dark:bg-[#1C2536] text-[11px] font-bold text-ink-normal/70 dark:text-gray-300">
                <th className="py-3.5 px-4">نام و مشخصات</th>
                <th className="py-3.5 px-4">سمت سازمانی</th>
                <th className="py-3.5 px-4">دپارتمان</th>
                <th className="py-3.5 px-4">سطح دسترسی در پنل</th>
                <th className="py-3.5 px-4">اتصال تلگرام</th>
                <th className="py-3.5 px-4 text-center">وضعیت</th>
                <th className="py-3.5 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-[#242F42]/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 dark:text-gray-500 font-bold">
                    در حال بارگذاری لیست کارکنان...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400 dark:text-gray-500 font-bold">
                    هیچ همکاری مطابق با فیلترهای انتخابی یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => {
                  const isEmpAdmin = emp.role === "admin";
                  const isEmpSupervisor = emp.role === "supervisor";
                  const hasWebAccess = isEmpAdmin || isEmpSupervisor;

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-gray-50/70 dark:hover:bg-[#1C2536]/50 transition-colors"
                    >
                      {/* Name and Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isEmpAdmin
                              ? "bg-sec text-white dark:bg-primary/20 dark:text-primary dark:border dark:border-primary/40 shadow-xs"
                              : isEmpSupervisor
                              ? "bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 dark:border dark:border-blue-900/50"
                              : "bg-gray-100 dark:bg-[#1C2536] text-gray-600 dark:text-gray-300 dark:border dark:border-gray-700/60"
                          }`}>
                            {isEmpAdmin ? (
                              <ShieldCheck className="w-4 h-4" />
                            ) : isEmpSupervisor ? (
                              <Building2 className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-sec dark:text-white">
                              {emp.fullName}
                            </div>
                            {emp.email && (
                              <div className="text-[10px] text-gray-400 dark:text-gray-400 font-mono mt-0.5" dir="ltr">
                                {emp.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Position */}
                      <td className="py-3.5 px-4 text-ink-normal/80 dark:text-gray-300">
                        {emp.position || "—"}
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 font-bold text-sec dark:text-gray-200">
                        {emp.department || "—"}
                      </td>

                      {/* Access Level Badge */}
                      <td className="py-3.5 px-4">
                        {isEmpAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-ecosystem-light dark:bg-primary/15 text-primary dark:text-primary font-bold text-[11px] border border-primary/25 dark:border-primary/40">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>راهبر ارشد</span>
                          </span>
                        ) : isEmpSupervisor ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold text-[11px] border border-blue-200 dark:border-blue-800/60">
                            <Building2 className="w-3.5 h-3.5" />
                            <span>راهبر واحد</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300 font-bold text-[11px] border border-transparent dark:border-gray-700/50">
                            <User className="w-3.5 h-3.5" />
                            <span>عضو تیم</span>
                          </span>
                        )}
                      </td>

                      {/* Telegram Connection & Link Code */}
                      <td className="py-3.5 px-4">
                        {emp.isLinked ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-green dark:text-emerald-400 bg-accent-green/10 dark:bg-emerald-950/50 border border-transparent dark:border-emerald-800/40 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>متصل به تلگرام</span>
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-black tracking-wider bg-gray-100 dark:bg-[#1C2536] px-2 py-1 rounded-md text-sec dark:text-primary border border-transparent dark:border-gray-700/60">
                              {emp.linkCode || "—"}
                            </span>
                            {emp.linkCode && (
                              <button
                                onClick={() => handleCopyCode(emp.id, emp.linkCode)}
                                title="کپی کد اتصال"
                                className="p-1 rounded text-gray-400 hover:text-sec dark:text-gray-400 dark:hover:text-white transition-colors"
                              >
                                {copiedId === emp.id ? (
                                  <Check className="w-3.5 h-3.5 text-accent-green" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                            <button
                              onClick={() => handleRegenerateCode(emp.id)}
                              title="تولید مجدد کد ۶ رقمی"
                              className="p-1 rounded text-gray-400 hover:text-primary dark:text-gray-400 dark:hover:text-primary transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Active Status Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => handleToggleActive(emp)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                            emp.isActive
                              ? "bg-accent-green/10 text-accent-green dark:bg-emerald-950/40 dark:text-emerald-400 dark:border dark:border-emerald-800/40"
                              : "bg-gray-100 text-gray-400 dark:bg-gray-800/80 dark:text-gray-400 dark:border dark:border-gray-700/40"
                          }`}
                        >
                          {emp.isActive ? "فعال" : "غیرفعال"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Password Reset for Web Users (Admins only) */}
                          {isAdmin && hasWebAccess && (
                            <button
                              onClick={() => handleOpenPasswordModal(emp)}
                              title="تنظیم رمز عبور پنل"
                              className="p-1.5 rounded-lg text-amber-500 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit Details */}
                          {(isAdmin || (isSupervisor && emp.role === "employee")) && (
                            <button
                              onClick={() => handleOpenEditModal(emp)}
                              title="ویرایش مشخصات"
                              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-400 hover:text-primary dark:hover:text-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Unlink Telegram */}
                          {(isAdmin || (isSupervisor && emp.role === "employee")) && emp.isLinked && (
                            <button
                              onClick={() => handleUnlink(emp.id)}
                              title="قطع اتصال تلگرام"
                              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-400 hover:text-accent-red dark:hover:text-red-400 hover:bg-accent-red/5 dark:hover:bg-red-950/30 transition-colors"
                            >
                              <Unlink className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete Employee */}
                          {(isAdmin || (isSupervisor && emp.role === "employee")) && (
                            <button
                              onClick={() => handleDeleteEmployee(emp)}
                              title="حذف همکار"
                              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-400 hover:text-accent-red dark:hover:text-red-400 hover:bg-accent-red/5 dark:hover:bg-red-950/30 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
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

      {/* ========================================================================= */}
      {/* MODAL 1: ADD EMPLOYEE (Unified with Access Level)                         */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="تعریف و افزودن همکار جدید"
        maxWidth="md"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">
              نام و نام خانوادگی *
            </label>
            <input
              type="text"
              required
              value={formFullName}
              onChange={(e) => setFormFullName(e.target.value)}
              placeholder="مثال: علی رضایی"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
            />
          </div>

          {/* Department & Position */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">
                دپارتمان / واحد سازمانی *
              </label>
              {isSupervisor ? (
                <input
                  type="text"
                  disabled
                  value={supervisorDepartment}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold bg-gray-100 dark:bg-gray-800 text-sec dark:text-gray-300"
                />
              ) : (
                <select
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none font-bold text-sec dark:text-white bg-white dark:bg-[#1C2536]"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">
                سمت سازمانی
              </label>
              <input
                type="text"
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
                placeholder="مثال: کارشناس تولید محتوا"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
              />
            </div>
          </div>

          {/* Access Level Selector */}
          <div>
            <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-2">
              سطح دسترسی در سامانه *
            </label>
            {isSupervisor ? (
              <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 dark:bg-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-primary dark:text-primary">عضو تیم</span>
                    <p className="text-[10px] text-ink-normal/60 dark:text-gray-400 mt-0.5">
                      ثبت گزارش کار در تلگرام و روتلو
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold">
                  تعریف عضو واحد
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* Option 1: Employee */}
                <label
                  className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                    formRole === "employee"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#1C2536] text-sec dark:text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">عضو تیم</span>
                    <input
                      type="radio"
                      name="formRole"
                      value="employee"
                      checked={formRole === "employee"}
                      onChange={() => setFormRole("employee")}
                      className="sr-only"
                    />
                    <User className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] text-ink-normal/60 dark:text-gray-400 mt-1">
                    ثبت گزارش کار در تلگرام و روتلو
                  </p>
                </label>

                {/* Option 2: Supervisor */}
                <label
                  className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                    formRole === "supervisor"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#1C2536] text-sec dark:text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">راهبر واحد</span>
                    <input
                      type="radio"
                      name="formRole"
                      value="supervisor"
                      checked={formRole === "supervisor"}
                      onChange={() => setFormRole("supervisor")}
                      className="sr-only"
                    />
                    <Building2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-[10px] text-ink-normal/60 dark:text-gray-400 mt-1">
                    دسترسی به پنل برای واحد انتخابی
                  </p>
                </label>

                {/* Option 3: Admin */}
                {isAdmin && (
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                      formRole === "admin"
                        ? "border-sec dark:border-primary bg-sec/5 dark:bg-primary/10 text-sec dark:text-white"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#1C2536] text-sec dark:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">راهبر ارشد</span>
                      <input
                        type="radio"
                        name="formRole"
                        value="admin"
                        checked={formRole === "admin"}
                        onChange={() => setFormRole("admin")}
                        className="sr-only"
                      />
                      <ShieldCheck className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-[10px] text-ink-normal/60 dark:text-gray-400 mt-1">
                      دسترسی کامل به تمام دپارتمان‌ها
                    </p>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Web Access Credentials Box (If supervisor or admin) */}
          {(formRole === "supervisor" || formRole === "admin") && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-3 animate-in fade-in zoom-in-95">
              <div className="text-xs font-bold text-sec dark:text-white flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>اطلاعات حساب ورود به پنل مدیریت</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sec dark:text-gray-200 mb-1">
                  ایمیل حساب کاربری جهت ورود *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="user@rokad.ir"
                    className="w-full pl-3 pr-9 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white text-left font-mono"
                    dir="ltr"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sec dark:text-gray-200 mb-1">
                  کلمه عبور جهت ورود به پنل *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="حداقل ۶ کاراکتر"
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {formError && (
            <div className="p-2.5 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
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
              disabled={formLoading}
              className="rokad-btn-primary px-5 py-2 text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-50"
            >
              {formLoading ? "در حال ثبت..." : "افزودن و دریافت کد اتصال"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT EMPLOYEE (Unified with Access Level)                        */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`ویرایش اطلاعات ${selectedEmployee?.fullName || "همکار"}`}
        maxWidth="md"
      >
        <form onSubmit={handleUpdateEmployee} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">
              نام و نام خانوادگی *
            </label>
            <input
              type="text"
              required
              value={formFullName}
              onChange={(e) => setFormFullName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">
                دپارتمان / واحد سازمانی *
              </label>
              {isSupervisor ? (
                <input
                  type="text"
                  disabled
                  value={supervisorDepartment}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold bg-gray-100 dark:bg-gray-800 text-sec dark:text-gray-300"
                />
              ) : (
                <select
                  value={formDepartment}
                  onChange={(e) => setFormDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none font-bold text-sec dark:text-white bg-white dark:bg-[#1C2536]"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">
                سمت سازمانی
              </label>
              <input
                type="text"
                value={formPosition}
                onChange={(e) => setFormPosition(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
              />
            </div>
          </div>

          {/* Access Level Selector */}
          <div>
            <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-2">
              سطح دسترسی در سامانه *
            </label>
            {isSupervisor ? (
              <div className="p-3.5 rounded-xl border border-primary/30 bg-primary/5 dark:bg-primary/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-primary dark:text-primary">عضو تیم</span>
                    <p className="text-[10px] text-ink-normal/60 dark:text-gray-400 mt-0.5">
                      ثبت گزارش کار در تلگرام و روتلو
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-bold">
                  عضو واحد
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <label
                  className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                    formRole === "employee"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#1C2536] text-sec dark:text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">عضو تیم</span>
                    <input
                      type="radio"
                      name="editFormRole"
                      value="employee"
                      checked={formRole === "employee"}
                      onChange={() => setFormRole("employee")}
                      className="sr-only"
                    />
                    <User className="w-4 h-4" />
                  </div>
                  <p className="text-[10px] text-ink-normal/60 dark:text-gray-400 mt-1">
                    ثبت گزارش کار در تلگرام و روتلو
                  </p>
                </label>

                <label
                  className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                    formRole === "supervisor"
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#1C2536] text-sec dark:text-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">راهبر واحد</span>
                    <input
                      type="radio"
                      name="editFormRole"
                      value="supervisor"
                      checked={formRole === "supervisor"}
                      onChange={() => setFormRole("supervisor")}
                      className="sr-only"
                    />
                    <Building2 className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-[10px] text-ink-normal/60 dark:text-gray-400 mt-1">
                    دسترسی به پنل برای واحد انتخابی
                  </p>
                </label>

                {isAdmin && (
                  <label
                    className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                      formRole === "admin"
                        ? "border-sec dark:border-primary bg-sec/5 dark:bg-primary/10 text-sec dark:text-white"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#1C2536] text-sec dark:text-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs">راهبر ارشد</span>
                      <input
                        type="radio"
                        name="editFormRole"
                        value="admin"
                        checked={formRole === "admin"}
                        onChange={() => setFormRole("admin")}
                        className="sr-only"
                      />
                      <ShieldCheck className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-[10px] text-ink-normal/60 dark:text-gray-400 mt-1">
                      دسترسی کامل به تمام دپارتمان‌ها
                    </p>
                  </label>
                )}
              </div>
            )}
          </div>

          {/* Web Access Credentials Box */}
          {(formRole === "supervisor" || formRole === "admin") && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-3">
              <div className="text-xs font-bold text-sec dark:text-white flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>اطلاعات حساب ورود به پنل مدیریت</span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sec dark:text-gray-200 mb-1">
                  ایمیل حساب کاربری جهت ورود *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="user@rokad.ir"
                    className="w-full pl-3 pr-9 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white text-left font-mono"
                    dir="ltr"
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sec dark:text-gray-200 mb-1">
                  تغییر کلمه عبور (در صورت نیاز به تغییر وارد کنید)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="در صورت عدم تغییر خالی بگذارید (حداقل ۶ کاراکتر)"
                    className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {formError && (
            <div className="p-2.5 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
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
              disabled={formLoading}
              className="rokad-btn-primary px-5 py-2 text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-50"
            >
              {formLoading ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </button>
          </div>
        </form>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 3: QUICK PASSWORD RESET MODAL                                      */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title={`تنظیم رمز عبور برای ${passwordTargetEmployee?.fullName || "کاربر"}`}
        maxWidth="sm"
      >
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
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 4: DEPARTMENTS MANAGEMENT MODAL (Senior Admin Only)                 */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isDeptModalOpen}
        onClose={() => setIsDeptModalOpen(false)}
        title="مدیریت دپارتمان‌ها و واحدهای سازمانی"
        maxWidth="lg"
      >
        <div className="space-y-6">
          {/* Create / Edit Form */}
          <form onSubmit={handleSaveDept} className="p-4 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-200/80 dark:border-gray-700/60 space-y-3">
            <div className="text-xs font-black text-sec dark:text-white flex items-center justify-between">
              <span>{editingDept ? `ویرایش دپارتمان: ${editingDept.name}` : "افزودن دپارتمان جدید"}</span>
              {editingDept && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingDept(null);
                    setDeptFormName("");
                    setDeptFormDesc("");
                  }}
                  className="text-primary text-[11px] font-bold hover:underline"
                >
                  انصراف از ویرایش
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-sec dark:text-gray-200 mb-1">
                  نام دپارتمان *
                </label>
                <input
                  type="text"
                  required
                  value={deptFormName}
                  onChange={(e) => setDeptFormName(e.target.value)}
                  placeholder="مثال: استودیو، پسرانه، بازاریابی"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-sec dark:text-gray-200 mb-1">
                  توضیحات (اختیاری)
                </label>
                <input
                  type="text"
                  value={deptFormDesc}
                  onChange={(e) => setDeptFormDesc(e.target.value)}
                  placeholder="توضیح کوتاه درباره حوزه فعالیت"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
                />
              </div>
            </div>

            {deptError && (
              <div className="p-2 rounded-xl bg-accent-red/10 text-accent-red text-xs font-bold">
                {deptError}
              </div>
            )}

            {deptSuccess && (
              <div className="p-2 rounded-xl bg-accent-green/10 text-accent-green text-xs font-bold">
                {deptSuccess}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={deptActionLoading}
                className="rokad-btn-primary px-4 py-2 text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-50"
              >
                {deptActionLoading ? "در حال ثبت..." : editingDept ? "ذخیره تغییرات" : "ایجاد دپارتمان"}
              </button>
            </div>
          </form>

          {/* List of Departments */}
          <div>
            <div className="text-xs font-black text-sec dark:text-white mb-2">
              لیست دپارتمان‌های موجود
            </div>
            <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C2536] rounded-xl overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-gray-100/70 dark:bg-[#151C28] text-[11px] font-bold text-gray-500 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2.5 px-3">نام دپارتمان</th>
                    <th className="py-2.5 px-3">تعداد اعضا</th>
                    <th className="py-2.5 px-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                  {departments.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50/50 dark:hover:bg-[#151C28]/60 transition-colors">
                      <td className="py-2.5 px-3 font-bold text-sec dark:text-white">
                        {d.name}
                        {d.description && (
                          <div className="text-[10px] text-gray-400 font-normal mt-0.5">
                            {d.description}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-primary">
                        {toPersianDigits(d.employeeCount || 0)} نفر
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEditDept(d)}
                            className="p-1 rounded text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
                            title="ویرایش نام دپارتمان"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteDept(d)}
                            className="p-1 rounded text-gray-400 hover:text-accent-red dark:hover:text-red-400 transition-colors"
                            title="حذف دپارتمان"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* MODAL 5: NEW CODE CREATED DISPLAY MODAL                                   */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isCodeModalOpen}
        onClose={() => setIsCodeModalOpen(false)}
        title="کد اتصال تلگرام صادر شد"
        maxWidth="sm"
      >
        <div className="space-y-4 text-center py-2">
          <div className="w-12 h-12 rounded-full bg-accent-green/10 text-accent-green flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <div className="text-sm font-black text-sec dark:text-white">
              کد ۶ رقمی برای {createdCodeInfo?.name}
            </div>
            <p className="text-xs text-ink-normal/60 dark:text-gray-400 mt-1">
              این کد به مدت ۲۴ ساعت معتبر است. همکار می‌تواند با ارسال این کد به بات تلگرام حساب خود را متصل کند.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center gap-3">
            <span className="font-mono text-2xl font-black tracking-widest text-primary">
              {createdCodeInfo?.code}
            </span>
            <button
              onClick={() => {
                if (createdCodeInfo) {
                  navigator.clipboard.writeText(createdCodeInfo.code);
                  alert("کد با موفقیت کپی شد.");
                }
              }}
              className="p-2 rounded-xl bg-white dark:bg-[#1C2536] text-sec dark:text-white shadow-xs hover:text-primary transition-colors"
              title="کپی کد"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => setIsCodeModalOpen(false)}
            className="w-full rokad-btn-primary py-2 text-xs rounded-xl"
          >
            متوجه شدم
          </button>
        </div>
      </Modal>
    </div>
  );
}
