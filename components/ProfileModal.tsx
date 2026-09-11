"use client";

import React, { useState, useEffect } from "react";
import Modal from "@/components/Modal";
import { User, Mail, Lock, ShieldCheck, Check, AlertCircle, Eye, EyeOff } from "lucide-react";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    id?: string;
    fullName?: string;
    email?: string;
    role?: string;
    assignedDepartment?: string;
  } | null;
  onProfileUpdated?: (updatedUser: any) => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}: ProfileModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFullName(currentUser?.fullName || "");
      setEmail(currentUser?.email || "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!fullName.trim()) {
      setError("نام و نام خانوادگی الزامی است.");
      return;
    }

    if (!email.trim() || !email.includes("@")) {
      setError("لطفاً یک ایمیل معتبر وارد کنید.");
      return;
    }

    if (newPassword) {
      if (!currentPassword) {
        setError("جهت تعیین کلمه عبور جدید، وارد کردن رمز عبور فعلی الزامی است.");
        return;
      }
      if (newPassword.length < 6) {
        setError("کلمه عبور جدید باید حداقل ۶ کاراکتر باشد.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("تکرار کلمه عبور جدید با آن مطابقت ندارد.");
        return;
      }
    }

    setLoading(true);
    try {
      const payload: Record<string, any> = {
        fullName: fullName.trim(),
        email: email.trim(),
      };
      if (newPassword) {
        payload.currentPassword = currentPassword;
        payload.newPassword = newPassword;
      }

      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "خطا در به‌روزرسانی پروفایل");
      } else {
        setSuccess("اطلاعات پروفایل شما با موفقیت به‌روزرسانی شد.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        if (onProfileUpdated && data.user) {
          onProfileUpdated(data.user);
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="پروفایل کاربری مدیر ارشد"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Badge Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sec dark:bg-primary text-white dark:text-sec flex items-center justify-center font-black shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-sec dark:text-white">
                سطح دسترسی شما
              </div>
              <div className="text-[11px] text-primary font-bold">
                مدیر ارشد سیستم (Super Admin)
              </div>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-ecosystem-light dark:bg-ecosystem-darker/60 text-primary font-bold border border-primary/30">
            دسترسی کامل
          </span>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">
            نام و نام خانوادگی *
          </label>
          <div className="relative">
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="مثال: مدیر ارشد رُکاد"
              className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
            />
            <User className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-bold text-sec dark:text-gray-200 mb-1">
            ایمیل حساب کاربری *
          </label>
          <div className="relative">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@rokad.ir"
              className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white text-left font-mono"
              dir="ltr"
            />
            <Mail className="w-4 h-4 text-gray-400 absolute right-3 top-3" />
          </div>
        </div>

        {/* Password Change Box (Optional) */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-3">
          <div className="text-xs font-bold text-sec dark:text-gray-200 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-primary" />
            <span>تغییر کلمه عبور (اختیاری)</span>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-ink-normal/70 dark:text-gray-400 mb-1">
              رمز عبور فعلی
            </label>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="رمز عبور فعلی خود را وارد کنید"
                className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-bold text-ink-normal/70 dark:text-gray-400 mb-1">
                رمز عبور جدید
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="حداقل ۶ کاراکتر"
                  className="w-full pl-10 pr-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute left-3 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink-normal/70 dark:text-gray-400 mb-1">
                تکرار رمز عبور جدید
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="تکرار کلمه عبور جدید"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 dark:border-gray-700 text-xs focus:border-primary focus:outline-none dark:bg-[#1C2536] dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Error / Success Alerts */}
        {error && (
          <div className="p-2.5 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-2.5 rounded-xl bg-accent-green/10 border border-accent-green/20 text-accent-green text-xs font-bold flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-sec dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            انصراف
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rokad-btn-primary px-5 py-2 text-xs rounded-xl flex items-center gap-1.5 disabled:opacity-50"
          >
            {loading ? "در حال ذخیره..." : "ذخیره مشخصات پروفایل"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
