import { getDb } from "@/lib/db/client";
import { notifications, employees } from "@/lib/db/schema";
import { eq, or, isNull, desc, and } from "drizzle-orm";
import { getMockCalendarEvents } from "@/lib/mockCalendar";

export type NotificationCategory = "task" | "calendar" | "report" | "system";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  type: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  senderName?: string;
  metadata?: Record<string, any>;
}

// In-memory fallback notification store for offline/demo operation
let fallbackNotifications: AppNotification[] = [
  {
    id: "notif-sys-welcome",
    title: "خوش‌آمدید به سامانه جامع رُکاد",
    message: "تمام بخش‌های مدیریت وظایف روتلو، تقویم و گزارش‌های روزانه فعال هستند.",
    category: "system",
    type: "announcement",
    link: "/dashboard",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    senderName: "مدیر سیستم",
  },
  {
    id: "notif-cal-meeting",
    title: "جلسه اجرایی هماهنگی هفتگی",
    message: "جلسه هماهنگی تیم ساعت ۱۰:۰۰ در سالن اجتماعات برگزار می‌شود.",
    category: "calendar",
    type: "meeting_reminder",
    link: "/calendar",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    senderName: "تقویم سازمانی",
  },
  {
    id: "notif-task-assigned",
    title: "وظیفه جدید در روتلو",
    message: "وظیفه «بررسی و تست نهایی ماژول تقویم» به شما واگذار شد.",
    category: "task",
    type: "task_assigned",
    link: "/rotello/my-tasks",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    senderName: "سیستم روتلو",
  },
  {
    id: "notif-report-daily",
    title: "ثبت گزارش عملکرد روزانه",
    message: "یادآوری: لطفاً گزارش فعالیت‌های کاری امروز خود را ثبت فرمایید.",
    category: "report",
    type: "daily_report_reminder",
    link: "/rotello/my-reports",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    senderName: "سامانه گزارش‌دهی",
  },
];

/**
 * Generate dynamic, context-aware notifications based on current date & calendar/tasks
 */
function getContextAwareNotifications(): AppNotification[] {
  const now = new Date();
  const todayIso = now.toISOString().split("T")[0];
  const dynamicItems: AppNotification[] = [];

  // Check today's calendar events
  try {
    const events = getMockCalendarEvents();
    const todayEvents = events.filter((e) => e.startDate === todayIso);
    for (const evt of todayEvents) {
      dynamicItems.push({
        id: `dyn-cal-${evt.id}`,
        title: `رویداد امروز: ${evt.title}`,
        message: `${evt.type === "meeting" ? "جلسه" : "برنامه"} ساعت ${evt.startTime || "صبح"} (${evt.location || "حضوری"})`,
        category: "calendar",
        type: "meeting_reminder",
        link: "/calendar",
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        senderName: "تقویم هوشمند",
        metadata: { eventId: evt.id },
      });
    }
  } catch (err) {
    // Ignore error
  }

  return dynamicItems;
}

/**
 * Fetch notifications for an employee or admin
 */
export async function getNotificationsForUser(
  employeeId?: string,
  category?: string,
  unreadOnly?: boolean
): Promise<{ notifications: AppNotification[]; unreadCount: number }> {
  try {
    const db = getDb();

    // Query DB
    const conditions = [];
    if (employeeId) {
      conditions.push(or(eq(notifications.recipientId, employeeId), isNull(notifications.recipientId)));
    }
    if (category && category !== "all") {
      conditions.push(eq(notifications.category, category));
    }
    if (unreadOnly) {
      conditions.push(eq(notifications.isRead, false));
    }

    const rows = await db
      .select({
        id: notifications.id,
        title: notifications.title,
        message: notifications.message,
        category: notifications.category,
        type: notifications.type,
        link: notifications.link,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        senderId: notifications.senderId,
        metadata: notifications.metadata,
      })
      .from(notifications)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(notifications.createdAt))
      .limit(50);

    if (rows && rows.length > 0) {
      const items: AppNotification[] = rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        message: r.message,
        category: r.category as NotificationCategory,
        type: r.type,
        link: r.link || undefined,
        isRead: r.isRead,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        metadata: r.metadata || undefined,
      }));

      const unreadCount = items.filter((n) => !n.isRead).length;
      return { notifications: items, unreadCount };
    }
  } catch (err) {
    console.warn("Could not query DB notifications table, using fallback store:", err);
  }

  // Fallback to in-memory store + dynamic contextual notifications
  const dynamic = getContextAwareNotifications();
  const allFallback = [...dynamic, ...fallbackNotifications];

  // De-duplicate by ID
  const uniqueMap = new Map<string, AppNotification>();
  for (const item of allFallback) {
    if (!uniqueMap.has(item.id)) {
      uniqueMap.set(item.id, item);
    }
  }

  let list = Array.from(uniqueMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (category && category !== "all") {
    list = list.filter((n) => n.category === category);
  }
  if (unreadOnly) {
    list = list.filter((n) => !n.isRead);
  }

  const unreadCount = list.filter((n) => !n.isRead).length;
  return { notifications: list, unreadCount };
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(id: string): Promise<boolean> {
  // Update in-memory fallback
  const found = fallbackNotifications.find((n) => n.id === id);
  if (found) {
    found.isRead = true;
  }

  try {
    const db = getDb();
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    return true;
  } catch (err) {
    // If DB fails, fallback succeeded
    return true;
  }
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsAsRead(employeeId?: string): Promise<boolean> {
  // Update in-memory fallback
  for (const n of fallbackNotifications) {
    n.isRead = true;
  }

  try {
    const db = getDb();
    if (employeeId) {
      await db
        .update(notifications)
        .set({ isRead: true })
        .where(or(eq(notifications.recipientId, employeeId), isNull(notifications.recipientId)));
    } else {
      await db.update(notifications).set({ isRead: true });
    }
    return true;
  } catch (err) {
    return true;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(id: string): Promise<boolean> {
  fallbackNotifications = fallbackNotifications.filter((n) => n.id !== id);

  try {
    const db = getDb();
    await db.delete(notifications).where(eq(notifications.id, id));
    return true;
  } catch (err) {
    return true;
  }
}

/**
 * Create a new notification
 */
export async function createNotification(data: {
  recipientId?: string | null;
  senderId?: string | null;
  title: string;
  message: string;
  category: NotificationCategory;
  type: string;
  link?: string;
  metadata?: Record<string, any>;
}): Promise<AppNotification> {
  const newNotif: AppNotification = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: data.title,
    message: data.message,
    category: data.category,
    type: data.type,
    link: data.link,
    isRead: false,
    createdAt: new Date().toISOString(),
    metadata: data.metadata,
  };

  try {
    const db = getDb();
    const inserted = await db
      .insert(notifications)
      .values({
        recipientId: data.recipientId || undefined,
        senderId: data.senderId || undefined,
        title: data.title,
        message: data.message,
        category: data.category,
        type: data.type,
        link: data.link,
        isRead: false,
        metadata: data.metadata,
      })
      .returning();

    if (inserted && inserted.length > 0) {
      return {
        id: inserted[0].id,
        title: inserted[0].title,
        message: inserted[0].message,
        category: inserted[0].category as NotificationCategory,
        type: inserted[0].type,
        link: inserted[0].link || undefined,
        isRead: inserted[0].isRead,
        createdAt: inserted[0].createdAt.toISOString(),
        metadata: inserted[0].metadata || undefined,
      };
    }
  } catch (err) {
    console.warn("DB insert for notification failed, keeping in fallback store:", err);
  }

  fallbackNotifications.unshift(newNotif);
  return newNotif;
}
