"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowLeft, ShieldCheck, Eye, EyeOff, Loader2, Users } from "lucide-react";
import Link from "next/link";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "ورود ناموفق بود. لطفاً اطلاعات را بررسی کنید.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "خطایی در ورود به سیستم رخ داد.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#F5F8F8] dark:bg-[#0B0F17] flex flex-col justify-center items-center p-4 sm:p-6 text-right transition-colors duration-200"
      dir="rtl"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#151C28] rounded-3xl p-7 sm:p-9 border-2 border-primary/20 dark:border-gray-800 shadow-[4px_4px_0_#202A5A] dark:shadow-[4px_4px_0_#59BBAF]">
        {/* Header & Rotello Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden shadow-[3px_3px_0_#202A5A] dark:shadow-[3px_3px_0_#59BBAF] border border-primary/40 mb-4 bg-primary/20 p-1">
            <img src="/icon.png" alt="لوگوی استودیو روتلو" className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-sec dark:text-white tracking-tight">استودیو روتلو</h1>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-sec/10 dark:bg-primary/20 text-sec dark:text-primary border border-sec/20 dark:border-primary/30">
              مدیران
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-normal/70 dark:text-gray-400 mt-1.5 font-medium">
            سامانه یکپارچه پایش و مدیریت • ورود مدیران و سرپرستان
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-start gap-3 bg-female-light dark:bg-female-darker/60 text-female-darker dark:text-female-light border-female-normal/40">
            <div className="leading-relaxed">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-black text-sec dark:text-white mb-2">
              ایمیل یا نام کاربری مدیر:
            </label>
            <div className="relative">
              <input
                type="text"
                required
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rokad.ir یا نام کاربری..."
                dir="ltr"
                className="w-full pl-3 pr-11 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-700 focus:border-primary focus:outline-none text-xs sm:text-sm font-bold bg-[#FAFAFA] dark:bg-[#121824] dark:text-white focus:bg-white dark:focus:bg-[#161D2A] transition-colors text-left"
              />
              <Mail className="w-5 h-5 text-ink-normal/40 dark:text-gray-500 absolute right-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-black text-sec dark:text-white mb-2">
              رمز عبور:
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                dir="ltr"
                className="w-full pl-11 pr-11 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-700 focus:border-primary focus:outline-none text-xs sm:text-sm font-bold bg-[#FAFAFA] dark:bg-[#121824] dark:text-white focus:bg-white dark:focus:bg-[#161D2A] transition-colors text-left"
              />
              <Lock className="w-5 h-5 text-ink-normal/40 dark:text-gray-500 absolute right-3.5 top-3.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                className="absolute left-3.5 top-3.5 text-ink-normal/40 dark:text-gray-500 hover:text-sec dark:hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 rokad-btn-primary py-3.5 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-[3px_3px_0_#1F413D]"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>در حال ورود به سیستم...</span>
              </>
            ) : (
              <>
                <span>ورود به پنل مدیریت</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Security / Help Info */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-sec dark:text-white">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>امنیت ورود و دسترسی:</span>
          </div>
          <p className="text-xs text-ink-normal/60 dark:text-gray-400 leading-relaxed font-medium">
            این بخش مختص مدیران سیستم و سرپرستان دپارتمان‌ها می‌باشد. در صورت فراموشی اطلاعات حساب کاربری، با مدیر ارشد سامانه در تماس باشید.
          </p>
        </div>

        {/* Back to Member Login Link */}
        <div className="mt-6 text-center pt-2">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-normal/60 dark:text-gray-400 hover:text-sec dark:hover:text-white transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>ورود همکاران و عوامل پروژه از طریق تلگرام</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
