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
  ChevronLeft,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    title: "داشبورد اصلی",
    href: "/dashboard",
    icon: LayoutDashboard,
    badge: null,
  },
  {
    title: "آنالیتیکس و خروجی",
    href: "/analytics",
    icon: BarChart3,
    badge: "جدید",
    badgeColor: "bg-ecosystem-light text-ecosystem-darker border border-primary/30",
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
    title: "شبیه‌ساز و راهنمای بات",
    href: "/bot-guide",
    icon: Bot,
    badge: "تست",
    badgeColor: "bg-club-light text-club-darker border border-club-normal/30",
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
              <div className="text-xs text-ink-normal/60 mt-1 font-medium">سامانه مدیریت گزارش کار</div>
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

        {/* Navigation Section */}
        <div className="p-4 space-y-2">
          <div className="text-xs font-bold text-ink-normal/40 px-3 py-1.5">منوی اصلی</div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-2xl text-[15px] font-bold transition-all duration-150 group",
                  isActive
                    ? "bg-ecosystem-light text-ecosystem-darker border border-primary/40 shadow-[2.5px_2.5px_0_#59BBAF]"
                    : "text-ink-normal/80 hover:bg-[#F5F7F9] hover:text-ink-normal"
                )}
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-primary" : "text-ink-normal/50 group-hover:text-primary"
                    )}
                  />
                  <span>{item.title}</span>
                </div>

                {item.badge ? (
                  <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-bold", item.badgeColor)}>
                    {item.badge}
                  </span>
                ) : (
                  isActive && <ChevronLeft className="w-4 h-4 text-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Brand Footer Card */}
      <div className="p-4 m-4 rounded-2xl bg-gradient-to-br from-ecosystem-light via-white to-college-light/30 border border-primary/20 shadow-sm text-center">
        <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-2 font-bold text-sm">
          🌿
        </div>
        <div className="text-sm font-bold text-sec">اکوسیستم رُکاد</div>
        <div className="text-xs text-ink-normal/60 mt-0.5">اتصال تلگرام + هوش گزارش‌دهی</div>
        <div className="mt-2.5 pt-2 border-t border-primary/10 text-xs text-ink-normal/50">
          نسخه ۱.۱.۰ — پایدار
        </div>
      </div>
    </aside>
  );
}
