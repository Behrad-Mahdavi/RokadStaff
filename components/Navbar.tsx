"use client";

import React, { useEffect, useState } from "react";
import { formatToJalali, formatTehranTime } from "@/lib/utils";
import { LogOut, User, Bell, Calendar, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<string>("");
  const [user, setUser] = useState<{ fullName?: string; email?: string } | null>(null);

  useEffect(() => {
    setCurrentDate(formatToJalali(new Date(), { showMonthName: true, includeDayName: true }));
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#EAEAEA] px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Date & Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-ecosystem-light text-ecosystem-darker px-3.5 py-1.5 rounded-full border border-ecosystem-normal/30 text-xs font-semibold">
          <Calendar className="w-4 h-4 text-primary" />
          <span>{currentDate || "در حال بارگذاری..."}</span>
        </div>
        <div className="hidden md:flex items-center gap-1.5 text-xs text-ink-normal/70 bg-[#F5F5F5] px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-accent-green animate-pulse"></span>
          <span>سرور تلگرام فعال</span>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 pr-3 border-r border-gray-200">
          <div className="w-9 h-9 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-primary font-bold text-sm">
            {user?.fullName ? user.fullName.slice(0, 1) : "م"}
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-sm font-bold text-ink-normal">{user?.fullName || "مدیر سیستم"}</div>
            <div className="text-[11px] text-ink-normal/60">{user?.email || "admin@rokad.ir"}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="خروج از سیستم"
          className="w-9 h-9 flex items-center justify-center rounded-lg text-ink-normal/70 hover:text-female-normal hover:bg-female-light/60 transition-colors border border-transparent hover:border-female-normal/20"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
