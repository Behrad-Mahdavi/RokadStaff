"use client";

import React from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_GROUPS = [
  {
    title: "مدیریت پروژه‌ها (Rotello)",
    items: [
      {
        title: "پروژه‌ها و بوردها",
        href: "/rotello/projects",
        icon: Kanban,
        badge: "کانبان",
        badgeColor: "bg-ecosystem-light text-ecosystem-darker border border-primary/30",
      },
      {
        title: "میز کار من",
        href: "/rotello/my-tasks",
        icon: Briefcase,
        badge: null,
      },
      {
        title: "آنالیتیکس پروژه‌ها",
        href: "/rotello/analytics",
        icon: Layers,
        badge: null,
      },
    ],
  },
  {
    title: "گزارش روزانه تلگرام (Rokad)",
    items: [
      {
        title: "داشبورد کل عملکرد",
        href: "/dashboard",
        icon: LayoutDashboard,
        badge: null,
      },
      {
        title: "آنالیتیکس و اکسل",
        href: "/analytics",
        icon: BarChart3,
        badge: null,
      },
      {
        title: "مدیریت کارکنان",
        href: "/employees",
        icon: Users,
        badge: null,
      },
      {
        title: "گزارش‌های روزانه",
        href: "/reports",
        icon: FileCheck2,
        badge: null,
      },
      {
        title: "غایبان در گزارش",
        href: "/reports/missing",
        icon: AlertTriangle,
        badge: "امروز",
        badgeColor: "bg-college-light text-college-darker border border-college-normal/30",
      },
      {
        title: "شبیه‌ساز بات تلگرام",
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

  return (
    <aside className="w-72 bg-white border-l border-[#EAEAEA] min-h-screen flex flex-col justify-between shrink-0 shadow-[2px_0_10px_rgba(0,0,0,0.03)] z-50">
      <div>
        {/* Brand Header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-[#EAEAEA]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary to-ecosystem-dark text-white flex items-center justify-center font-black text-2xl shadow-[2.5px_2.5px_0_#202A5A]">
              رُ
            </div>
            <div>
              <div className="font-extrabold text-lg text-sec leading-none">رُکاد‌استاف</div>
              <div className="text-xs text-ink-normal/60 mt-1 font-medium">گزارش روزانه + Rotello</div>
            </div>
          </div>

          {/* Close button for mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="p-4 space-y-6">
          {NAV_GROUPS.map((group, gIdx) => (
            <div key={gIdx} className="space-y-1.5">
              <div className="text-xs font-black text-ink-normal/40 px-3 py-1">
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
                        ? "bg-ecosystem-light text-ecosystem-darker border border-primary/40 shadow-[2px_2px_0_#59BBAF]"
                        : "text-ink-normal/80 hover:bg-[#F5F7F9] hover:text-ink-normal"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={cn(
                          "w-4 h-4 transition-colors",
                          isActive ? "text-primary" : "text-ink-normal/50 group-hover:text-primary"
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
      <div className="p-4 m-4 rounded-2xl bg-gradient-to-br from-ecosystem-light via-white to-college-light/30 border border-primary/20 shadow-sm text-center">
        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-1.5 font-bold text-xs">
          🌿
        </div>
        <div className="text-xs font-black text-sec">اکوسیستم رُکاد‌استاف</div>
        <div className="text-[11px] text-ink-normal/60 mt-0.5">مدیریت تسک‌ها + اتصال هوشمند تلگرام</div>
      </div>
    </aside>
  );
}
