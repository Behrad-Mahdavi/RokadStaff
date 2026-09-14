"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  CheckCheck,
  Calendar,
  CheckSquare,
  FileText,
  Sparkles,
  Trash2,
  X,
  Clock,
} from "lucide-react";
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
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications from server
  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
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
  }, []);

  // Close on outside click or Escape
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
          icon: CheckSquare,
          badgeColor: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
          dotColor: "bg-emerald-500",
        };
      case "calendar":
        return {
          icon: Calendar,
          badgeColor: "bg-blue-50 text-sec dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
          dotColor: "bg-sec dark:bg-blue-400",
        };
      case "report":
        return {
          icon: FileText,
          badgeColor: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800",
          dotColor: "bg-amber-500",
        };
      case "system":
      default:
        return {
          icon: Sparkles,
          badgeColor: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
          dotColor: "bg-purple-500",
        };
    }
  };

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
        title="اعلان‌ها"
        aria-label="اعلان‌ها"
      >
        <Bell className="w-4 h-4" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-female-normal text-white text-[10px] font-black flex items-center justify-center shadow-sm animate-in zoom-in duration-200 ring-2 ring-white dark:ring-[#121824]">
            {toPersianDigits(unreadCount > 99 ? "+99" : unreadCount)}
            <span className="absolute inset-0 rounded-full bg-female-normal animate-ping opacity-30 pointer-events-none" />
          </span>
        )}
      </button>

      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/25 dark:bg-black/50 backdrop-blur-[2px] z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="fixed top-20 inset-x-3 sm:inset-x-auto sm:absolute sm:top-full sm:left-0 sm:mt-2 sm:w-[380px] bg-white dark:bg-[#151C28] rounded-2xl sm:rounded-3xl border border-gray-200 dark:border-gray-800 shadow-[2px_2px_0_#202A5A] sm:shadow-[2.75px_2.75px_0_#202A5A] dark:shadow-[2px_2px_0_#59BBAF] sm:dark:shadow-[2.75px_2.75px_0_#59BBAF] z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[calc(100vh-100px)] sm:max-h-[460px]">
          {/* Header */}
          <div className="p-3 sm:p-3.5 border-b border-gray-100 dark:border-gray-800 bg-[#F5F7FA]/70 dark:bg-[#1A2333]/70 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black text-sec dark:text-white">
                اعلان‌ها
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-black">
                  {toPersianDigits(unreadCount)} جدید
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-ink-normal/80 dark:text-gray-200 hover:text-primary dark:hover:text-primary text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                  title="خواندن همه"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-primary" />
                  <span>خواندن همه</span>
                </button>
              )}

              {/* Close Button on Mobile */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 text-ink-normal/60 dark:text-gray-400 sm:hidden cursor-pointer"
                title="بستن"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List (Purely notifications) */}
          <div className="overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800/60 p-1 sm:p-1.5 flex-1">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-2xl bg-gray-100 dark:bg-gray-800/60 text-ink-normal/40 dark:text-gray-500 flex items-center justify-center mb-2.5">
                  <Bell className="w-5 h-5 stroke-[1.5]" />
                </div>
                <p className="text-xs sm:text-sm font-black text-sec dark:text-gray-200">
                  هیچ اعلانی وجود ندارد
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
                      "p-2.5 sm:p-3 rounded-xl sm:rounded-2xl transition-all cursor-pointer group relative flex items-start gap-2.5",
                      notif.isRead
                        ? "hover:bg-gray-50 dark:hover:bg-gray-800/40 opacity-75 hover:opacity-100"
                        : "bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/15 border border-primary/20 dark:border-primary/20 shadow-2xs"
                    )}
                  >
                    {/* Category Icon */}
                    <div
                      className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 border mt-0.5",
                        config.badgeColor
                      )}
                    >
                      <IconComponent className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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
                          />
                        )}
                      </div>

                      <p className="text-[11px] text-ink-normal/70 dark:text-gray-300 line-clamp-2 leading-relaxed font-medium">
                        {notif.message}
                      </p>

                      <div className="flex items-center gap-1 mt-1 text-[10px] text-ink-normal/50 dark:text-gray-400 font-bold">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{formatRelativePersianTime(notif.createdAt)}</span>
                      </div>
                    </div>

                    {/* Dismiss Button */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, notif.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-ink-normal/50 hover:text-female-normal transition-all shrink-0 cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
