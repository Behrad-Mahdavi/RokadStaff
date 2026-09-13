// In-memory fallback and store for Executive Calendar
// Ensures resilience if DB is offline

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
  globalStore.__mockCalendarEvents = [];
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
