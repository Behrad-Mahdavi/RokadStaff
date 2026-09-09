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
        title: "میز کار من",
        href: "/rotello/my-tasks",
        icon: Briefcase,
        badge: null,
      },
      {
        title: "پروژه‌ها",
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
        title: "میز کار من",
        href: "/rotello/my-tasks",
        icon: Briefcase,
        badge: null,
      },
      {
        title: "پروژه‌ها",
        href: "/rotello/projects",
        icon: Kanban,
        badge: null,
      },
      {
        title: "داشبورد مانیتورینگ",
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
        title: "داشبورد عملکرد روزانه",
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
        badge: null,
      },
      {
        title: "گزارش‌گیری",
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
    <aside className="w-72 bg-white dark:bg-[#121824] border-l border-[#EAEAEA] dark:border-gray-800 h-full min-h-screen flex flex-col justify-between shrink-0 shadow-[2px_0_10px_rgba(0,0,0,0.03)] dark:shadow-none z-50 transition-colors duration-200 overflow-y-auto">
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
                <span className="text-xs font-black px-2 py-0.5 rounded-full bg-primary/15 dark:bg-primary/25 text-primary border border-primary/30">
                  عوامل
                </span>
              </div>
              <div className="text-xs text-ink-normal/60 dark:text-gray-400 mt-0.5 font-medium">
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

        {/* Navigation Items */}
        <div className="p-4 space-y-1">
          {navGroups.map((group, gIdx) => (
            <React.Fragment key={gIdx}>
              {gIdx > 0 && (
                <div className="my-2.5 border-t border-gray-100 dark:border-gray-800/80" />
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = (() => {
                    if (item.href === "/reports") {
                      return pathname === "/reports" || pathname === "/reports/missing";
                    }
                    if (item.href === "/reports/employee") {
                      return pathname.startsWith("/reports/employee");
                    }
                    if (item.href === "/rotello/projects") {
                      return pathname === "/rotello/projects" || pathname.startsWith("/rotello/projects/");
                    }
                    if (item.href === "/dashboard") {
                      return pathname === "/dashboard";
                    }
                    return pathname === item.href || pathname.startsWith(item.href + "/");
                  })();

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

                      {isActive && <ChevronLeft className="w-3.5 h-3.5 text-primary" />}
                    </Link>
                  );
                })}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    </aside>
  );
}
