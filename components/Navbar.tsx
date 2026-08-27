"use client";

import React, { useEffect, useState } from "react";
import { formatToJalali } from "@/lib/utils";
import { LogOut, Calendar, Menu, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export default function Navbar({ onToggleMobileMenu }: NavbarProps) {
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
    <header className="h-20 bg-white border-b border-[#EAEAEA] px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Mobile Hamburger & Date */}
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="lg:hidden p-2 rounded-xl text-sec hover:bg-gray-100 border border-gray-200 transition-colors"
            title="منوی اصلی"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex items-center gap-2 bg-ecosystem-light text-ecosystem-darker px-3.5 py-2 rounded-full border border-ecosystem-normal/30 text-xs sm:text-sm font-bold">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <span>{currentDate || "در حال بارگذاری..."}</span>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs sm:text-sm text-ink-normal/80 bg-[#F5F5F5] px-3.5 py-2 rounded-full font-medium">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-green animate-pulse shrink-0"></span>
          <span>سرور تلگرام متصل</span>
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-3 pr-2 sm:pr-3 border-r border-gray-200">
          <div className="w-10 h-10 rounded-full bg-primary/15 border-2 border-primary/40 flex items-center justify-center text-primary font-black text-base">
            {user?.fullName ? user.fullName.slice(0, 1) : "م"}
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-sm sm:text-base font-black text-ink-normal">{user?.fullName || "مدیر سیستم"}</div>
            <div className="text-xs text-ink-normal/60">{user?.email || "admin@rokad.ir"}</div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          title="خروج از سیستم"
          className="w-10 h-10 flex items-center justify-center rounded-xl text-ink-normal/70 hover:text-female-normal hover:bg-female-light/60 transition-colors border border-transparent hover:border-female-normal/20"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
