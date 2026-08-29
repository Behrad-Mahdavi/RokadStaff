"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowLeft, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import RokadLogo from "@/components/RokadLogo";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        throw new Error(data.error || "ورود ناموفق بود.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#EEF8F7] via-[#F8F9FA] to-[#FEF6E8] flex flex-col justify-center items-center p-4 relative overflow-hidden font-vazirmatn text-right" dir="rtl">
      {/* Background Decor Shapes */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 rounded-full bg-college-normal/10 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sec to-primary text-white mx-auto flex items-center justify-center shadow-[3px_3px_0_#202A5A] mb-3 p-3.5">
            <RokadLogo className="w-full h-full text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-sec tracking-tight">رُکاد‌استاف</h1>
          <p className="text-sm text-ink-normal/60 mt-1 font-medium">پورتال اختصاصی ورود مدیران سیستم</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#EAEAEA] shadow-[4px_4px_0_#202A5A]">
          <div className="flex items-center gap-2 mb-6 text-base font-black text-sec">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>ورود مدیران و سرپرستان</span>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-female-light text-female-darker border border-female-normal/30 text-xs sm:text-sm font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-ink-normal/80 mb-1.5">
                ایمیل سازمانی مدیر
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ایمیل سازمانی..."
                  dir="ltr"
                  className="w-full pl-3 pr-11 py-3 rounded-xl border-1.5 border-[#DFDFDF] focus:border-primary focus:outline-none text-sm sm:text-base transition-colors text-left bg-gray-50/50 focus:bg-white font-medium"
                />
                <Mail className="w-5 h-5 text-ink-normal/40 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-bold text-ink-normal/80 mb-1.5">
                رمز عبور
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  dir="ltr"
                  className="w-full pl-3 pr-11 py-3 rounded-xl border-1.5 border-[#DFDFDF] focus:border-primary focus:outline-none text-sm sm:text-base transition-colors text-left bg-gray-50/50 focus:bg-white font-medium"
                />
                <Lock className="w-5 h-5 text-ink-normal/40 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 rokad-btn-primary py-3.5 text-sm sm:text-base rounded-xl font-black shadow-[2.5px_2.5px_0_#1F413D] flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>در حال ورود...</span>
              ) : (
                <>
                  <span>ورود به پنل مدیریت</span>
                  <ArrowLeft className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Back to Member Portal */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-xs font-bold text-ink-normal/60 hover:text-sec transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>بازگشت به پورتال اصلی همکاران</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
