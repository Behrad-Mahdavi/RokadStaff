import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import {
  calendarEvents,
  calendarEventAttendees,
  employees,
} from "@/lib/db/schema";
import { eq, and, desc, gte, lte, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import {
  getMockCalendarEvents,
  addMockCalendarEvent,
} from "@/lib/mockCalendar";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const departmentParam = searchParams.get("department");
  const typeParam = searchParams.get("type");
  const searchParam = searchParams.get("search")?.trim().toLowerCase();
  const myOnlyParam = searchParams.get("myOnly") === "true";

  const currentEmpId = session.employeeId || session.userId;

  try {
    const db = getDb();
    const conditions = [];

    if (startDateParam) {
      conditions.push(gte(calendarEvents.startDate, startDateParam));
    }
    if (endDateParam) {
      conditions.push(lte(calendarEvents.startDate, endDateParam));
    }
    if (departmentParam && departmentParam !== "all") {
      conditions.push(eq(calendarEvents.department, departmentParam));
    }
    if (typeParam && typeParam !== "all") {
      conditions.push(eq(calendarEvents.type, typeParam));
    }

    const eventsList = await db
      .select()
      .from(calendarEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(calendarEvents.startDate), desc(calendarEvents.startTime));

    // Fetch attendees for all retrieved events
    const eventIds = eventsList.map((e: any) => e.id);
    let attendeesByEventId: Record<string, any[]> = {};

    if (eventIds.length > 0) {
      const attendeesRows = await db
        .select({
          id: calendarEventAttendees.id,
          eventId: calendarEventAttendees.eventId,
          employeeId: calendarEventAttendees.employeeId,
          role: calendarEventAttendees.role,
          status: calendarEventAttendees.status,
          fullName: employees.fullName,
          department: employees.department,
          position: employees.position,
        })
        .from(calendarEventAttendees)
        .leftJoin(employees, eq(calendarEventAttendees.employeeId, employees.id))
        .where(inArray(calendarEventAttendees.eventId, eventIds));

      for (const row of attendeesRows) {
        if (!attendeesByEventId[row.eventId]) {
          attendeesByEventId[row.eventId] = [];
        }
        attendeesByEventId[row.eventId].push({
          id: row.id,
          employeeId: row.employeeId,
          employeeName: row.fullName || "نامشخص",
          employeeDepartment: row.department,
          position: row.position,
          role: row.role,
          status: row.status,
        });
      }
    }

    let combined = eventsList.map((evt: any) => ({
      ...evt,
      attendees: attendeesByEventId[evt.id] || [],
    }));

    // Apply search filter if present
    if (searchParam) {
      combined = combined.filter(
        (evt: any) =>
          evt.title?.toLowerCase().includes(searchParam) ||
          evt.description?.toLowerCase().includes(searchParam) ||
          evt.location?.toLowerCase().includes(searchParam)
      );
    }

    // Apply myOnly filter if requested
    if (myOnlyParam && currentEmpId) {
      combined = combined.filter((evt: any) => {
        const isCreator = evt.createdBy === currentEmpId;
        const isAttendee = evt.attendees.some(
          (a: any) => a.employeeId === currentEmpId
        );
        return isCreator || isAttendee;
      });
    }

    return NextResponse.json({ events: combined });
  } catch (error: any) {
    console.warn("DB query failed, returning fallback mock store:", error);
    let mockList = getMockCalendarEvents();
    if (departmentParam && departmentParam !== "all") {
      mockList = mockList.filter((e) => e.department === departmentParam);
    }
    if (typeParam && typeParam !== "all") {
      mockList = mockList.filter((e) => e.type === typeParam);
    }
    return NextResponse.json({ events: mockList });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      type = "meeting",
      department,
      color = "#59BBAF",
      startDate,
      endDate,
      startTime,
      endTime,
      isAllDay = false,
      location,
      status = "scheduled",
      reminder = "none",
      attendeeIds = [],
    } = body;

    if (!title || typeof title !== "string" || !title.trim()) {
      return NextResponse.json(
        { error: "عنوان رویداد یا جلسه الزامی است." },
        { status: 400 }
      );
    }

    if (!startDate || typeof startDate !== "string") {
      return NextResponse.json(
        { error: "تاریخ برگزاری رویداد الزامی است." },
        { status: 400 }
      );
    }

    if (!department || typeof department !== "string") {
      return NextResponse.json(
        { error: "انتخاب دپارتمان الزامی است." },
        { status: 400 }
      );
    }

    const currentEmpId = session.employeeId || session.userId || null;
    const currentName = session.fullName || "کاربر سیستم";

    try {
      const db = getDb();
      const [insertedEvent] = await db
        .insert(calendarEvents)
        .values({
          title: title.trim(),
          description: description?.trim() || null,
          type: type === "event" ? "event" : "meeting",
          department: department.trim(),
          color: color || "#59BBAF",
          startDate,
          endDate: endDate || startDate,
          startTime: startTime || null,
          endTime: endTime || null,
          isAllDay: Boolean(isAllDay),
          location: location?.trim() || null,
          status: status || "scheduled",
          reminder: reminder || "none",
          createdBy: currentEmpId,
          createdByName: currentName,
        })
        .returning();

      // Insert attendees if provided
      let insertedAttendees: any[] = [];
      if (Array.isArray(attendeeIds) && attendeeIds.length > 0) {
        const attendeeRecords = attendeeIds.map((empId: string) => ({
          eventId: insertedEvent.id,
          employeeId: empId,
          role: "attendee",
          status: "pending",
        }));

        await db.insert(calendarEventAttendees).values(attendeeRecords);

        // Fetch attendee names
        const employeesList = await db
          .select({
            id: employees.id,
            fullName: employees.fullName,
            department: employees.department,
            position: employees.position,
          })
          .from(employees)
          .where(inArray(employees.id, attendeeIds));

        insertedAttendees = employeesList.map((emp: any) => ({
          employeeId: emp.id,
          employeeName: emp.fullName,
          employeeDepartment: emp.department,
          position: emp.position,
          role: "attendee",
          status: "pending",
        }));
      }

      const responseEvent = {
        ...insertedEvent,
        attendees: insertedAttendees,
      };

      // Also sync to mock store
      addMockCalendarEvent(responseEvent);

      return NextResponse.json({
        success: true,
        event: responseEvent,
      });
    } catch (dbError: any) {
      console.warn("DB insert failed, writing to in-memory store:", dbError);
      const fallbackEvent = {
        id: `mock-${Date.now()}`,
        title: title.trim(),
        description: description?.trim() || null,
        type: (type === "event" ? "event" : "meeting") as "event" | "meeting",
        department: department.trim(),
        color: color || "#59BBAF",
        startDate,
        endDate: endDate || startDate,
        startTime: startTime || null,
        endTime: endTime || null,
        isAllDay: Boolean(isAllDay),
        location: location?.trim() || null,
        status: (status || "scheduled") as any,
        reminder: (reminder || "none") as any,
        createdBy: currentEmpId,
        createdByName: currentName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        attendees: (attendeeIds || []).map((id: string) => ({
          id: `att-${id}`,
          employeeId: id,
          employeeName: "عضو تیم",
          role: "attendee" as const,
          status: "pending" as const,
        })),
      };

      addMockCalendarEvent(fallbackEvent);

      return NextResponse.json({
        success: true,
        event: fallbackEvent,
      });
    }
  } catch (err: any) {
    console.error("POST /api/calendar/events error:", err);
    return NextResponse.json(
      { error: err.message || "خطا در ثبت رویداد" },
      { status: 500 }
    );
  }
}
