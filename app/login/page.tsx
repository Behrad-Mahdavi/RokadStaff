"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail, ArrowLeft, Sparkles, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@rokad.ir");
  const [password, setPassword] = useState("admin123456");
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
    <div className="min-h-screen bg-gradient-to-br from-[#EEF8F7] via-[#F8F9FA] to-[#FEF6E8] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background Decor Shapes */}
      <div className="absolute top-[-10%] right-[-5%] w-96 h-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 rounded-full bg-college-normal/10 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-ecosystem-dark text-white mx-auto flex items-center justify-center font-black text-3xl shadow-[3px_3px_0_#202A5A] mb-3">
            رُ
          </div>
          <h1 className="text-2xl font-black text-sec tracking-tight">رُکاد‌استاف</h1>
          <p className="text-sm text-ink-normal/60 mt-1">سامانه مدیریت و پایش گزارش کار روزانه</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-8 border-2 border-[#EAEAEA] shadow-[4px_4px_0_#202A5A]">
          <div className="flex items-center gap-2 mb-6 text-sm font-bold text-sec">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>ورود به پنل مدیریت</span>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-female-light text-female-darker border border-female-normal/30 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-ink-normal/80 mb-1.5">
                ایمیل سازمانی
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rokad.ir"
                  dir="ltr"
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border-1.5 border-[#DFDFDF] focus:border-primary focus:outline-none text-sm transition-colors text-left bg-gray-50/50 focus:bg-white"
                />
                <Mail className="w-4 h-4 text-ink-normal/40 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-normal/80 mb-1.5">
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
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border-1.5 border-[#DFDFDF] focus:border-primary focus:outline-none text-sm transition-colors text-left bg-gray-50/50 focus:bg-white"
                />
                <Lock className="w-4 h-4 text-ink-normal/40 absolute right-3.5 top-3.5" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rokad-btn-primary py-3 text-sm rounded-xl font-bold shadow-[2.5px_2.5px_0_#1F413D]"
            >
              {loading ? (
                <span>در حال ورود...</span>
              ) : (
                <>
                  <span>ورود به سیستم</span>
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-[11px] text-ink-normal/60 bg-ecosystem-light/50 p-3 rounded-xl border border-primary/20">
            <div className="font-bold text-ecosystem-darker mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              حساب پیش‌فرض سیستم:
            </div>
            <div className="flex justify-between font-mono dir-ltr mt-1">
              <span>admin@rokad.ir</span>
              <span>admin123456</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
