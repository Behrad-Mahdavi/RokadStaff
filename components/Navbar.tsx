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
  UserCog,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import QuickTaskModal from "@/components/QuickTaskModal";
import ProfileModal from "@/components/ProfileModal";

interface NavbarProps {
  onToggleMobileMenu?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export default function Navbar({
  onToggleMobileMenu,
  onToggleSidebar,
  isSidebarOpen = true,
}: NavbarProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState<string>("");
  const [isQuickTaskOpen, setIsQuickTaskOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState<{
    id?: string;
    fullName?: string;
    email?: string;
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
      ? "راهبر ارشد سیستم"
      : user?.role === "supervisor"
      ? `راهبر دپارتمان ${user?.department || (user as any)?.assignedDepartment || ""}`
      : user?.department
      ? `عضو دپارتمان ${user.department}`
      : "عضو تیم";

  const canQuickAdd = user?.role === "admin" || user?.role === "supervisor";

  return (
    <>
      <header className="h-20 bg-white dark:bg-[#121824] border-b border-[#EAEAEA] dark:border-gray-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm transition-colors duration-200">
        {/* Sidebar Toggle & Date (Right side in RTL) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Toggle Sidebar Button for both Desktop & Mobile */}
          <button
            onClick={() => {
              if (typeof window !== "undefined" && window.innerWidth < 1024) {
                onToggleMobileMenu?.();
              } else {
                onToggleSidebar?.();
              }
            }}
            className="p-2.5 rounded-xl text-sec dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-all duration-150 flex items-center justify-center group shadow-sm active:scale-95"
            title={isSidebarOpen ? "بستن منوی کناری (سایدبار)" : "باز کردن منوی کناری (سایدبار)"}
          >
            <Menu className="w-5 h-5 text-sec dark:text-gray-200 group-hover:text-primary transition-colors" />
          </button>

          {/* Quick Task Create Button */}
          {canQuickAdd && (
            <button
              onClick={() => setIsQuickTaskOpen(true)}
              className="rokad-btn-primary px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-xl flex items-center gap-1.5 shadow-xs font-bold"
              title="ایجاد وظیفه جدید"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden md:inline">ثبت وظیفه جدید</span>
            </button>
          )}

          {/* Current Jalali Date Display */}
          <div className="hidden lg:flex items-center gap-2 text-xs text-ink-normal/60 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/60 px-3.5 py-2 rounded-xl border border-gray-100 dark:border-gray-700/60 font-bold">
            <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>{currentDate || "امروز"}</span>
          </div>
        </div>

        {/* Action Controls & User Profile (Left side in RTL) */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-ink-normal/70 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
            title={isDarkMode ? "تغییر به تم روز" : "تغییر به تم شب"}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-sec" />
            )}
          </button>

          {/* User Profile Dropdown Menu */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-2.5 sm:gap-3 p-1.5 sm:pr-3 sm:pl-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800/80 transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 select-none"
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
                <div className="p-3 bg-gray-50 dark:bg-[#1C2536] rounded-xl mb-1.5">
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

                {/* Profile Edit Button */}
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-sec dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1C2536] hover:text-primary dark:hover:text-primary transition-colors text-right"
                >
                  <UserCog className="w-4 h-4 text-primary" />
                  <span>پروفایل و مشخصات من</span>
                </button>

                {/* Logout Button */}
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-female-normal hover:bg-female-light/50 dark:hover:bg-female-normal/20 transition-colors text-right"
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

      {/* Senior Admin Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={user}
        onProfileUpdated={(updated) => {
          setUser((prev) => (prev ? { ...prev, ...updated } : updated));
        }}
      />
    </>
  );
}
