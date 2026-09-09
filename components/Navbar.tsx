"use client";

import React, { useEffect, useState, useRef } from "react";
import { formatToJalali } from "@/lib/utils";
import {
  LogOut,
  Calendar,
  Menu,
  Plus,
  Moon,
  Sun,
  ChevronDown,
  User,
  Briefcase,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import QuickTaskModal from "@/components/QuickTaskModal";

interface NavbarProps {
  onToggleMobileMenu?: () => void;
}

export default function Navbar({ onToggleMobileMenu }: NavbarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<string>("");
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<{
    id?: string;
    fullName?: string;
    role?: string;
    department?: string;
    phone?: string;
  } | null>(null);

  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Initialize theme and load user
  useEffect(() => {
    setCurrentDate(formatToJalali(new Date(), { showMonthName: true, includeDayName: true }));

    // Check initial dark mode
    if (typeof window !== "undefined") {
      const isDark =
        document.documentElement.classList.contains("dark") ||
        localStorage.getItem("theme") === "dark" ||
        (!localStorage.getItem("theme") &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }

    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          setUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDarkMode;
    setIsDarkMode(nextDark);
    if (nextDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const userSubtitle =
    user?.role === "admin"
      ? "مدیر ارشد سیستم"
      : user?.department
      ? `دپارتمان ${user.department}`
      : "همکار";

  const canQuickAdd = user?.role === "admin" || user?.role === "supervisor";

  return (
    <>
      <header className="h-20 bg-white dark:bg-[#121824] border-b border-[#EAEAEA] dark:border-gray-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors duration-200">
        {/* Mobile Hamburger & Date */}
        <div className="flex items-center gap-3">
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="lg:hidden p-2 rounded-xl text-sec dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors"
              title="منوی اصلی"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2 bg-ecosystem-light dark:bg-ecosystem-darker/50 text-ecosystem-darker dark:text-ecosystem-light px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-full border border-ecosystem-normal/30 text-[11px] sm:text-xs md:text-sm font-bold truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary shrink-0" />
            <span className="truncate">{currentDate || "در حال بارگذاری..."}</span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs sm:text-sm text-ink-normal/80 dark:text-gray-300 bg-[#F5F5F5] dark:bg-gray-800/80 px-3.5 py-2 rounded-full font-medium border border-gray-200/50 dark:border-gray-700/50">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-green animate-pulse shrink-0"></span>
            <span>سرور تلگرام متصل</span>
          </div>
        </div>

        {/* User Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Add Task */}
          {canQuickAdd && (
            <button
              onClick={() => setIsQuickTaskOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-gradient-to-r from-primary to-ecosystem-dark text-white text-xs sm:text-sm font-black shadow-[2px_2px_0_#202A5A] dark:shadow-[2px_2px_0_#1F413D] hover:opacity-95 transition"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">وظیفه جدید</span>
            </button>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            aria-label="تغییر حالت شب و روز"
            title={isDarkMode ? "تغییر به حالت روشن" : "تغییر به حالت تاریک"}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-ink-normal/70 dark:text-gray-300 hover:text-primary dark:hover:text-primary transition-all duration-150"
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-college-normal transition-transform duration-200 rotate-0" />
            ) : (
              <Moon className="w-4 h-4 text-sec transition-transform duration-200" />
            )}
          </button>

          {/* Elevated User Profile Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl border border-gray-200 dark:border-gray-700/80 hover:border-primary/50 dark:hover:border-primary/50 bg-gray-50/70 dark:bg-gray-800/60 transition-all duration-150 group"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-primary to-ecosystem-dark text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-sm shrink-0">
                {user?.fullName ? user.fullName.slice(0, 1) : "ک"}
              </div>

              <div className="hidden sm:block text-right">
                <div className="text-xs sm:text-sm font-black text-sec dark:text-white leading-tight">
                  {user?.fullName || "کاربر سامانه"}
                </div>
                <div className="text-[10px] text-ink-normal/60 dark:text-gray-400 mt-0.5">
                  {userSubtitle}
                </div>
              </div>

              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 hidden sm:block ${
                  isProfileMenuOpen ? "rotate-180 text-primary" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu Popup */}
            {isProfileMenuOpen && (
              <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-[#161D2A] rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                {/* User Info Header */}
                <div className="p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl mb-1.5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-ecosystem-dark text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                      {user?.fullName ? user.fullName.slice(0, 1) : "ک"}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm font-black text-sec dark:text-white truncate">
                        {user?.fullName || "کاربر سامانه"}
                      </div>
                      <div className="text-xs text-ink-normal/60 dark:text-gray-400 mt-0.5 flex items-center gap-1 truncate">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{userSubtitle}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div className="my-1.5 border-t border-gray-100 dark:border-gray-800" />

                {/* Logout Button */}
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-female-normal hover:bg-female-light/50 dark:hover:bg-female-normal/10 transition-colors text-right"
                >
                  <LogOut className="w-4 h-4" />
                  <span>خروج از حساب کاربری</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Quick Task Modal */}
      <QuickTaskModal
        isOpen={isQuickTaskOpen}
        onClose={() => setIsQuickTaskOpen(false)}
        onTaskCreated={() => {
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("task-created"));
          }
        }}
      />
    </>
  );
}
