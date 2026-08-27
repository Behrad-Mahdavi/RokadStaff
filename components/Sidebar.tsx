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
  Layers,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    title: "داشبورد تحلیلی",
    href: "/dashboard",
    icon: LayoutDashboard,
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
    title: "شبیه‌ساز و راهنمای بات",
    href: "/bot-guide",
    icon: Bot,
    badge: "تست",
    badgeColor: "bg-club-light text-club-darker border border-club-normal/30",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-l border-[#EAEAEA] min-h-screen flex flex-col justify-between shrink-0 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
      <div>
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-[#EAEAEA]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-ecosystem-dark text-white flex items-center justify-center font-black text-xl shadow-[2px_2px_0_#202A5A]">
            رُ
          </div>
          <div>
            <div className="font-extrabold text-base text-sec leading-none">رُکاد‌استاف</div>
            <div className="text-[11px] text-ink-normal/60 mt-1 font-medium">سامانه مدیریت گزارش کار</div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-4 space-y-1.5">
          <div className="text-[11px] font-bold text-ink-normal/40 px-3 py-1">منوی اصلی</div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 group",
                  isActive
                    ? "bg-ecosystem-light text-ecosystem-darker border border-primary/40 shadow-[2px_2px_0_#59BBAF]"
                    : "text-ink-normal/80 hover:bg-[#F5F7F9] hover:text-ink-normal"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-primary" : "text-ink-normal/50 group-hover:text-primary"
                    )}
                  />
                  <span>{item.title}</span>
                </div>

                {item.badge ? (
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold", item.badgeColor)}>
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
      <div className="p-4 m-3 rounded-2xl bg-gradient-to-br from-ecosystem-light via-white to-college-light/30 border border-primary/20 shadow-sm text-center">
        <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto mb-2 font-bold text-xs">
          🌿
        </div>
        <div className="text-xs font-bold text-sec">اکوسیستم رُکاد</div>
        <div className="text-[11px] text-ink-normal/60 mt-0.5">اتصال تلگرام + هوش گزارش‌دهی</div>
        <div className="mt-2.5 pt-2 border-t border-primary/10 text-[10px] text-ink-normal/50">
          نسخه ۱.۰.۰ — پایدار
        </div>
      </div>
    </aside>
  );
}
