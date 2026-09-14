"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCheck,
  Calendar,
  CheckSquare,
  FileText,
  Sparkles,
  ExternalLink,
  Trash2,
  X,
  Clock,
  Layers,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, toPersianDigits } from "@/lib/utils";
import { AppNotification, NotificationCategory } from "@/lib/notifications";

function formatRelativePersianTime(dateStr: string): string {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    if (isNaN(diffMs)) return "اخیراً";
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 45) return "چند لحظه پیش";
    if (diffMin < 60) return `${toPersianDigits(diffMin)} دقیقه پیش`;
    if (diffHour < 24) return `${toPersianDigits(diffHour)} ساعت پیش`;
    if (diffDay === 1) return "دیروز";
    if (diffDay < 7) return `${toPersianDigits(diffDay)} روز پیش`;
    return `${toPersianDigits(Math.floor(diffDay / 7))} هفته پیش`;
  } catch {
    return "اخیراً";
  }
}

export default function NotificationDropdown() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from server
  const fetchNotifications = async (cat?: string) => {
    try {
      const selectedCategory = cat !== undefined ? cat : activeCategory;
      const url =
        selectedCategory && selectedCategory !== "all"
          ? `/api/notifications?category=${selectedCategory}`
          : "/api/notifications";

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.warn("Failed to fetch notifications:", err);
    }
  };

  // Initial fetch and auto-polling every 45s
  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 45000);

    return () => clearInterval(interval);
  }, [activeCategory]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications/mark-all", { method: "POST" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Mark single as read & navigate if link exists
  const handleItemClick = async (notif: AppNotification) => {
    if (!notif.isRead) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      try {
        await fetch(`/api/notifications/${notif.id}`, { method: "PATCH" });
      } catch (err) {
        console.error(err);
      }
    }

    if (notif.link) {
      setIsOpen(false);
      router.push(notif.link);
    }
  };

  // Delete notification
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();

    // Optimistic removal
    const target = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (target && !target.isRead) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error(err);
    }
  };

  const getCategoryConfig = (category: NotificationCategory) => {
    switch (category) {
      case "task":
        return {
          label: "وظایف روتلو",
          icon: CheckSquare,
          badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800",
          iconColor: "text-emerald-600 dark:text-emerald-400",
          dotColor: "bg-emerald-500",
        };
      case "calendar":
        return {
          label: "تقویم و جلسات",
          icon: Calendar,
          badgeColor: "bg-blue-100 text-sec dark:bg-blue-950/40 dark:text-blue-300 border-blue-300 dark:border-blue-800",
          iconColor: "text-sec dark:text-blue-400",
          dotColor: "bg-sec dark:bg-blue-400",
        };
      case "report":
        return {
          label: "گزارش روزانه",
          icon: FileText,
          badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-300 dark:border-amber-800",
          iconColor: "text-amber-600 dark:text-amber-400",
          dotColor: "bg-amber-500",
        };
      case "system":
      default:
        return {
          label: "سیستم",
          icon: Sparkles,
          badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-300 dark:border-purple-800",
          iconColor: "text-purple-600 dark:text-purple-400",
          dotColor: "bg-purple-500",
        };
    }
  };

  const categories = [
    { id: "all", label: "همه" },
    { id: "task", label: "روتلو" },
    { id: "calendar", label: "تقویم" },
    { id: "report", label: "گزارش‌ها" },
    { id: "system", label: "سیستم" },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => {
          const next = !isOpen;
          setIsOpen(next);
          if (next) {
            fetchNotifications();
          }
        }}
        className={cn(
          "p-2.5 rounded-xl border transition-all duration-150 relative flex items-center justify-center cursor-pointer active:scale-95",
          isOpen
            ? "border-primary bg-primary/10 text-primary shadow-xs"
            : "border-gray-200 dark:border-gray-700 text-ink-normal/70 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
        title="اعلان‌ها و رویدادها"
        aria-label="اعلان‌ها و رویدادها"
      >
        <Bell className="w-4 h-4" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-female-normal text-white text-[10px] font-black flex items-center justify-center shadow-sm animate-in zoom-in duration-200 ring-2 ring-white dark:ring-[#121824]">
            {toPersianDigits(unreadCount > 99 ? "+99" : unreadCount)}
            {/* Subtle pulse ring */}
            <span className="absolute inset-0 rounded-full bg-female-normal animate-ping opacity-30 pointer-events-none" />
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute left-0 mt-2.5 w-[330px] sm:w-[410px] bg-white dark:bg-[#151C28] rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-[2px_2px_0_#202A5A] sm:shadow-[2.75px_2.75px_0_#202A5A] dark:shadow-[2px_2px_0_#59BBAF] sm:dark:shadow-[2.75px_2.75px_0_#59BBAF] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-gray-100 dark:border-gray-800 bg-[#F5F7FA]/70 dark:bg-[#1A2333]/70 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-black">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-sec dark:text-white leading-tight">
                  مرکز اعلان‌ها و رویدادها
                </h3>
                <span className="text-[10px] font-bold text-ink-normal/60 dark:text-gray-400">
                  {unreadCount > 0
                    ? `${toPersianDigits(unreadCount)} اعلان خوانده نشده`
                    : "همه اعلان‌ها خوانده شده است"}
                </span>
              </div>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink-normal/80 dark:text-gray-200 hover:text-primary dark:hover:text-primary text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                title="علامت‌گذاری همه به‌عنوان خوانده شده"
              >
                <CheckCheck className="w-3.5 h-3.5 text-primary" />
                <span>خواندن همه</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="px-3 pt-2.5 pb-2 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#151C28] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat.id);
                    fetchNotifications(cat.id);
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer",
                    isActive
                      ? "bg-sec dark:bg-primary text-white shadow-xs"
                      : "text-ink-normal/70 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Notifications Scroll List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/60 p-1.5 sm:p-2">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-800/60 text-ink-normal/40 dark:text-gray-500 flex items-center justify-center mb-3">
                  <Bell className="w-6 h-6 stroke-[1.5]" />
                </div>
                <p className="text-xs sm:text-sm font-black text-sec dark:text-gray-200">
                  هیچ اعلانی در این بخش وجود ندارد
                </p>
                <p className="text-[11px] text-ink-normal/60 dark:text-gray-400 mt-1">
                  رویدادها و وظایف جدید در اینجا نمایش داده خواهند شد.
                </p>
              </div>
            ) : (
              notifications.map((notif) => {
                const config = getCategoryConfig(notif.category);
                const IconComponent = config.icon;

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={cn(
                      "p-3 rounded-2xl transition-all cursor-pointer group relative flex items-start gap-2.5 sm:gap-3",
                      notif.isRead
                        ? "hover:bg-gray-50 dark:hover:bg-gray-800/40 opacity-80 hover:opacity-100"
                        : "bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/15 border border-primary/20 dark:border-primary/20 shadow-2xs"
                    )}
                  >
                    {/* Category Icon */}
                    <div
                      className={cn(
                        "w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5",
                        config.badgeColor
                      )}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="text-xs font-black text-sec dark:text-white truncate">
                          {notif.title}
                        </span>

                        {!notif.isRead && (
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0 ring-2 ring-white dark:ring-[#151C28]",
                              config.dotColor
                            )}
                            title="خوانده نشده"
                          />
                        )}
                      </div>

                      <p className="text-[11px] text-ink-normal/70 dark:text-gray-300 line-clamp-2 leading-relaxed font-medium">
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between mt-1.5 text-[10px] text-ink-normal/50 dark:text-gray-400">
                        <span className="flex items-center gap-1 font-bold">
                          <Clock className="w-3 h-3" />
                          <span>{formatRelativePersianTime(notif.createdAt)}</span>
                        </span>

                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-ink-normal/60 dark:text-gray-400">
                          {config.label}
                        </span>
                      </div>
                    </div>

                    {/* Dismiss Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, notif.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-ink-normal/50 hover:text-female-normal transition-all shrink-0 cursor-pointer"
                      title="حذف این اعلان"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Quick Footer Links */}
          <div className="p-2.5 sm:p-3 border-t border-gray-100 dark:border-gray-800 bg-[#F5F7FA]/70 dark:bg-[#1A2333]/70 flex items-center justify-between text-[11px] font-bold text-ink-normal/70 dark:text-gray-300">
            <Link
              href="/rotello/my-tasks"
              onClick={() => setIsOpen(false)}
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <CheckSquare className="w-3 h-3 text-primary" />
              <span>وظایف من</span>
            </Link>

            <span className="text-gray-300 dark:text-gray-700">•</span>

            <Link
              href="/calendar"
              onClick={() => setIsOpen(false)}
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <Calendar className="w-3 h-3 text-primary" />
              <span>تقویم جلسات</span>
            </Link>

            <span className="text-gray-300 dark:text-gray-700">•</span>

            <Link
              href="/rotello/my-reports"
              onClick={() => setIsOpen(false)}
              className="hover:text-primary transition-colors flex items-center gap-1"
            >
              <FileText className="w-3 h-3 text-primary" />
              <span>گزارش‌ها</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
