// In-memory fallback and store for Executive Calendar
// Ensures resilience if DB is offline and provides sample initial data

export interface MockCalendarEvent {
  id: string;
  title: string;
  description: string | null;
  type: "meeting" | "event";
  department: string;
  color: string;
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD
  startTime: string | null; // HH:mm
  endTime: string | null; // HH:mm
  isAllDay: boolean;
  location: string | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  reminder: "none" | "15m" | "30m" | "1h" | "1d";
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
  attendees?: {
    id: string;
    employeeId: string;
    employeeName: string;
    employeeDepartment?: string;
    role: "organizer" | "attendee";
    status: "accepted" | "declined" | "pending";
  }[];
}

const globalStore = global as any;
if (!globalStore.__mockCalendarEvents) {
  // Pre-seed 3 sample events for current month
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  // Tomorrow
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowStr = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}`;

  // Day after tomorrow
  const dayAfter = new Date(today);
  dayAfter.setDate(today.getDate() + 2);
  const dayAfterStr = `${dayAfter.getFullYear()}-${pad(dayAfter.getMonth() + 1)}-${pad(dayAfter.getDate())}`;

  globalStore.__mockCalendarEvents = [
    {
      id: "seed-event-1",
      title: "جلسه هماهنگی هفتگی واحد پسرانه",
      description: "بررسی وظایف اسپرینت جاری، وضعیت گزارش‌های روزانه همکاران و هماهنگی چالش‌های آموزشی",
      type: "meeting",
      department: "پسرانه",
      color: "#202A5A",
      startDate: todayStr,
      endDate: todayStr,
      startTime: "10:00",
      endTime: "11:30",
      isAllDay: false,
      location: "اتاق جلسات ۱ (سالن کنفرانس)",
      status: "scheduled",
      reminder: "15m",
      createdBy: "admin-dev",
      createdByName: "مدیر روتلو",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attendees: [],
    },
    {
      id: "seed-event-2",
      title: "جلسه برنامه‌ریزی دپارتمان دخترانه",
      description: "بررسی شاخص‌های عملکرد و تنظیم تقویم کارگاه‌های ماه آینده",
      type: "meeting",
      department: "دخترانه",
      color: "#E0195B",
      startDate: tomorrowStr,
      endDate: tomorrowStr,
      startTime: "14:00",
      endTime: "15:30",
      isAllDay: false,
      location: "https://meet.google.com/rokad-meeting",
      status: "scheduled",
      reminder: "30m",
      createdBy: "admin-dev",
      createdByName: "راهبر واحد",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attendees: [],
    },
    {
      id: "seed-event-3",
      title: "رویداد گردهمایی فصلی تیم‌های روتلو",
      description: "ارائه دستاوردهای فصل گذشته و تقدیر از همکاران برتر",
      type: "event",
      department: "پسرانه",
      color: "#59BBAF",
      startDate: dayAfterStr,
      endDate: dayAfterStr,
      startTime: "09:00",
      endTime: "17:00",
      isAllDay: true,
      location: "سالن همایش‌های راکد",
      status: "scheduled",
      reminder: "1d",
      createdBy: "admin-dev",
      createdByName: "مدیر روتلو",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attendees: [],
    },
  ];
}

export function getMockCalendarEvents(): MockCalendarEvent[] {
  return globalStore.__mockCalendarEvents || [];
}

export function addMockCalendarEvent(event: MockCalendarEvent): MockCalendarEvent {
  globalStore.__mockCalendarEvents = [event, ...(globalStore.__mockCalendarEvents || [])];
  return event;
}

export function updateMockCalendarEvent(
  id: string,
  updatedData: Partial<MockCalendarEvent>
): MockCalendarEvent | null {
  const events: MockCalendarEvent[] = globalStore.__mockCalendarEvents || [];
  const idx = events.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  events[idx] = {
    ...events[idx],
    ...updatedData,
    updatedAt: new Date().toISOString(),
  };
  return events[idx];
}

export function deleteMockCalendarEvent(id: string): boolean {
  const events: MockCalendarEvent[] = globalStore.__mockCalendarEvents || [];
  const initialLength = events.length;
  globalStore.__mockCalendarEvents = events.filter((e) => e.id !== id);
  return globalStore.__mockCalendarEvents.length < initialLength;
}
