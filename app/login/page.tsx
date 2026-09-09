"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, Sparkles, AlertCircle, ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import Link from "next/link";
import RokadLogo from "@/components/RokadLogo";

export default function MemberLoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleRequestMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) return;

    setLoading(true);
    setStatusMessage(null);

    try {
      const res = await fetch("/api/auth/request-login-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });

      const data = await res.json();

      if (res.ok) {
        setStatusMessage({
          type: "success",
          text: data.message || "لینک ورود مستقیم با موفقیت به ربات تلگرام شما ارسال شد.",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: data.error || "خطا در برقراری ارتباط. لطفاً مجدداً تلاش کنید.",
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: "خطای غیرمنتظره در سرور رخ داد.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F8F8] dark:bg-[#0B0F17] flex flex-col justify-center items-center p-4 sm:p-6 font-vazirmatn text-right transition-colors duration-200" dir="rtl">
      <div className="w-full max-w-md bg-white dark:bg-[#151C28] rounded-3xl p-7 sm:p-9 border-2 border-primary/20 dark:border-gray-800 shadow-[4px_4px_0_#59BBAF]">
        {/* Header & Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden shadow-[3px_3px_0_#202A5A] dark:shadow-[3px_3px_0_#59BBAF] border border-primary/30 mb-4 shrink-0">
            <img src="/icon.png" alt="لوگوی روتلو" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-sec dark:text-white tracking-tight">روتلو</h1>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-primary/15 dark:bg-primary/25 text-primary border border-primary/30">
              عوامل
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-normal/70 dark:text-gray-400 mt-1.5 font-medium">
            مدیریت پروژه‌ها و کارها • ورود همکاران از طریق تلگرام
          </p>
        </div>

        {/* Feedback Alert */}
        {statusMessage && (
          <div
            className={`mb-6 p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-start gap-3 ${
              statusMessage.type === "success"
                ? "bg-ecosystem-light border-primary/40 text-ecosystem-darker"
                : "bg-female-light border-female-normal/40 text-female-darker"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-primary mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 shrink-0 text-female-normal mt-0.5" />
            )}
            <div className="leading-relaxed">{statusMessage.text}</div>
          </div>
        )}

        {/* Magic Link Form */}
        <form onSubmit={handleRequestMagicLink} className="space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-black text-sec dark:text-white mb-2">
              نام و نام خانوادگی یا کد اتصال شما:
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="مثال: بهراد مهدوی یا کد ۶ رقمی"
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 dark:border-gray-700 focus:border-primary focus:outline-none text-xs sm:text-sm font-bold bg-[#FAFAFA] dark:bg-[#121824] dark:text-white focus:bg-white dark:focus:bg-[#161D2A] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rokad-btn-primary py-3.5 rounded-2xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-[3px_3px_0_#1F413D]"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? "در حال بررسی و ارسال..." : "دریافت لینک ورود در تلگرام"}</span>
          </button>
        </form>

        {/* How it works info */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-sec dark:text-white">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>راهنمای ورود بدون رمز:</span>
          </div>
          <p className="text-xs text-ink-normal/60 dark:text-gray-400 leading-relaxed font-medium">
            با زدن دکمه بالا، یک لینک ورود یکبارمصرف (۱۰ دقیقه‌ای) به ربات تلگرام شما ارسال می‌شود. کافی است روی آن کلیک کنید تا مستقیماً وارد میز کار خود شوید.
          </p>
        </div>

        {/* Dedicated Admin Login Link */}
        <div className="mt-6 text-center pt-2">
          <Link
            href="/admin-login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-ink-normal/50 dark:text-gray-400 hover:text-sec dark:hover:text-white transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-ink-normal/40 dark:text-gray-500" />
            <span>ورود به پنل مدیریت</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
