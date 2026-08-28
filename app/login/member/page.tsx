"use client";

import React, { useState } from "react";
import { Send, CheckCircle2, Sparkles, AlertCircle, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
    <div className="min-h-screen bg-[#F5F8F8] flex flex-col justify-center items-center p-4 sm:p-6 font-vazirmatn text-right" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-3xl p-7 sm:p-9 border-2 border-primary/20 shadow-[4px_4px_0_#59BBAF]">
        {/* Header & Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ecosystem-light border border-primary/30 shadow-sm mb-4">
            <Send className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-sec tracking-tight">ورود همکاران به رُکاد‌استاف</h1>
          <p className="text-xs sm:text-sm text-ink-normal/70 mt-1.5 font-medium">
            ورود امن و بدون نیاز به رمز عبور از طریق ربات تلگرام
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
            <label className="block text-xs sm:text-sm font-black text-sec mb-2">
              نام و نام خانوادگی یا کد اتصال شما:
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="مثال: بهراد مهدوی یا کد ۶ رقمی"
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-300 focus:border-primary focus:outline-none text-xs sm:text-sm font-bold bg-[#FAFAFA] focus:bg-white transition-colors"
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
        <div className="mt-8 pt-6 border-t border-gray-100 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black text-sec">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>راهنمای ورود:</span>
          </div>
          <p className="text-xs text-ink-normal/60 leading-relaxed font-medium">
            با زدن دکمه بالا، یک لینک ورود یکبارمصرف (۱۰ دقیقه‌ای) به ربات تلگرام شما ارسال می‌شود. کافی است روی آن کلیک کنید تا بدون نیاز به رمز عبور مستقیماً وارد میز کار خود شوید.
          </p>
        </div>

        {/* Switch to Admin Login */}
        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-xs font-bold text-ink-normal/60 hover:text-sec transition-colors"
          >
            <span>ورود مدیران و سرپرستان سیستم</span>
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
          </Link>
        </div>
      </div>
    </div>
  );
}
