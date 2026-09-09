"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  AlertTriangle,
  Bot,
  BarChart3,
  Kanban,
  Briefcase,
  Layers,
  ChevronLeft,
  X,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const EMPLOYEE_NAV_GROUPS = [
  {
    title: "میز کار و پروژه‌ها",
    items: [
      {
        title: "میز کار و وظایف من",
        href: "/rotello/my-tasks",
        icon: Briefcase,
        badge: null,
      },
      {
        title: "پروژه‌ها و بوردها",
        href: "/rotello/projects",
        icon: Kanban,
        badge: null,
      },
    ],
  },
];

const ADMIN_NAV_GROUPS = [
  {
    title: "مدیریت پروژه‌ها و کارها",
    items: [
      {
        title: "پروژه‌ها و بوردها",
        href: "/rotello/projects",
        icon: Kanban,
        badge: null,
      },
      {
        title: "میز کار من",
        href: "/rotello/my-tasks",
        icon: Briefcase,
        badge: null,
      },
      {
        title: "آمار و پیشرفت پروژه‌ها",
        href: "/rotello/analytics",
        icon: Layers,
        badge: null,
      },
    ],
  },
  {
    title: "پایش عملکرد و گزارش‌ها",
    items: [
      {
        title: "داشبورد کل عملکرد",
        href: "/dashboard",
        icon: LayoutDashboard,
        badge: null,
      },
      {
        title: "گزارش‌های روزانه",
        href: "/reports",
        icon: FileCheck2,
        badge: null,
      },
      {
        title: "کارنامه جامع همکاران",
        href: "/reports/employee",
        icon: FileText,
        badge: "جامع",
        badgeColor: "bg-ecosystem-light dark:bg-ecosystem-darker/70 text-ecosystem-darker dark:text-ecosystem-light border border-primary/30",
      },
      {
        title: "پیگیری عدم ثبت گزارش",
        href: "/reports/missing",
        icon: AlertTriangle,
        badge: "امروز",
        badgeColor: "bg-college-light dark:bg-college-darker/70 text-college-darker dark:text-college-light border border-college-normal/30",
      },
      {
        title: "تحلیل آماری و فایل اکسل",
        href: "/analytics",
        icon: BarChart3,
        badge: null,
      },
    ],
  },
  {
    title: "سازمان و ابزارها",
    items: [
      {
        title: "مدیریت همکاران",
        href: "/employees",
        icon: Users,
        badge: null,
      },
      {
        title: "راهنما و آزمون ربات",
        href: "/bot-guide",
        icon: Bot,
        badge: null,
      },
    ],
  },
];

interface SidebarProps {
  onCloseMobile?: () => void;
}

export default function Sidebar({ onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch(() => {});
  }, []);

  const isEmployee = currentUser?.role === "employee";
  const navGroups = isEmployee ? EMPLOYEE_NAV_GROUPS : ADMIN_NAV_GROUPS;

  return (
    <aside className="w-72 bg-white dark:bg-[#121824] border-l border-[#EAEAEA] dark:border-gray-800 min-h-screen flex flex-col justify-between shrink-0 shadow-[2px_0_10px_rgba(0,0,0,0.03)] dark:shadow-none z-50 transition-colors duration-200">
      <div>
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-[#EAEAEA] dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl overflow-hidden shadow-[2.5px_2.5px_0_#202A5A] dark:shadow-[2.5px_2.5px_0_#59BBAF] border border-primary/40 shrink-0 bg-primary/20">
              <img src="/icon.png" alt="لوگوی روتلو" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl text-sec dark:text-white tracking-tight">روتلو</span>
                <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-primary/15 dark:bg-primary/25 text-primary border border-primary/30">
                  عوامل
                </span>
              </div>
              <div className="text-[11px] text-ink-normal/60 dark:text-gray-400 mt-1 font-medium">
                مدیریت پروژه‌ها و کارها
              </div>
            </div>
          </div>

          {/* Close button for mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="p-4 space-y-6">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              <div className="text-xs font-black text-ink-normal/40 dark:text-gray-400 px-3 py-1">
                {group.title}
              </div>
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/dashboard" &&
                    item.href !== "/rotello/projects" &&
                    pathname.startsWith(item.href)) ||
                  (item.href === "/rotello/projects" &&
                    pathname.startsWith("/rotello/projects/"));

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onCloseMobile}
                    className={cn(
                      "flex items-center justify-between px-4 py-2.5 rounded-2xl text-[14px] font-bold transition-all duration-150 group",
                      isActive
                        ? "bg-ecosystem-light dark:bg-ecosystem-darker/60 text-ecosystem-darker dark:text-ecosystem-light border border-primary/40 shadow-[2px_2px_0_#59BBAF]"
                        : "text-ink-normal/80 dark:text-gray-300 hover:bg-[#F5F7F9] dark:hover:bg-gray-800/60 hover:text-ink-normal dark:hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "w-4 h-4 transition-colors",
                          isActive ? "text-primary" : "text-ink-normal/50 dark:text-gray-400 group-hover:text-primary"
                        )}
                      />
                      <span>{item.title}</span>
                    </div>

                    {item.badge ? (
                      <span
                        className={cn(
                          "text-[11px] px-2 py-0.5 rounded-full font-bold",
                          item.badgeColor
                        )}
                      >
                        {item.badge}
                      </span>
                    ) : (
                      isActive && <ChevronLeft className="w-3.5 h-3.5 text-primary" />
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Brand Footer Card */}
      <div className="p-4 m-4 rounded-2xl bg-gradient-to-br from-ecosystem-light/60 via-white to-ecosystem-light/30 dark:from-gray-800/80 dark:via-gray-800/50 dark:to-gray-800/80 border border-primary/20 dark:border-gray-700 shadow-sm text-center">
        <div className="text-xs font-black text-sec dark:text-gray-200 flex items-center justify-center gap-1.5">
          <span>سامانه روتلو</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">عوامل</span>
        </div>
        <div className="text-[11px] text-ink-normal/60 dark:text-gray-400 mt-1">
          مدیریت پروژه‌ها و کارها
        </div>
      </div>
    </aside>
  );
}
