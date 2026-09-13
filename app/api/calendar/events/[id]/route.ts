import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import {
  calendarEvents,
  calendarEventAttendees,
  employees,
} from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import {
  getMockCalendarEvents,
  updateMockCalendarEvent,
  deleteMockCalendarEvent,
} from "@/lib/mockCalendar";

interface RouteParams {
  params: { id: string };
}

// Helper to check user authorization to edit/delete an event
function canUserModifyEvent(session: any, event: any): boolean {
  if (!session || !event) return false;

  // 1. Super Admin can edit/delete any event
  if (session.role === "admin") {
    return true;
  }

  const currentEmpId = session.employeeId || session.userId;

  // 2. Event creator can always edit/delete their own event
  if (event.createdBy && currentEmpId && event.createdBy === currentEmpId) {
    return true;
  }

  // 3. Supervisor can edit/delete events belonging to their assigned department
  if (
    session.role === "supervisor" &&
    session.assignedDepartment &&
    event.department === session.assignedDepartment
  ) {
    return true;
  }

  return false;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const db = getDb();
    const [event] = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, id))
      .limit(1);

    if (!event) {
      // Check mock store
      const mockEvent = getMockCalendarEvents().find((e) => e.id === id);
      if (mockEvent) {
        return NextResponse.json({
          event: mockEvent,
          canEdit: canUserModifyEvent(session, mockEvent),
        });
      }
      return NextResponse.json({ error: "رویداد یافت نشد." }, { status: 404 });
    }

    // Fetch attendees
    const attendeesRows = await db
      .select({
        id: calendarEventAttendees.id,
        employeeId: calendarEventAttendees.employeeId,
        role: calendarEventAttendees.role,
        status: calendarEventAttendees.status,
        fullName: employees.fullName,
        department: employees.department,
        position: employees.position,
      })
      .from(calendarEventAttendees)
      .leftJoin(employees, eq(calendarEventAttendees.employeeId, employees.id))
      .where(eq(calendarEventAttendees.eventId, id));

    const attendees = attendeesRows.map((r: any) => ({
      id: r.id,
      employeeId: r.employeeId,
      employeeName: r.fullName || "نامشخص",
      employeeDepartment: r.department,
      position: r.position,
      role: r.role,
      status: r.status,
    }));

    const fullEvent = {
      ...event,
      attendees,
    };

    return NextResponse.json({
      event: fullEvent,
      canEdit: canUserModifyEvent(session, fullEvent),
    });
  } catch (err: any) {
    const mockEvent = getMockCalendarEvents().find((e) => e.id === id);
    if (mockEvent) {
      return NextResponse.json({
        event: mockEvent,
        canEdit: canUserModifyEvent(session, mockEvent),
      });
    }
    return NextResponse.json(
      { error: err.message || "خطا در دریافت اطلاعات رویداد" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const body = await req.json();
    const {
      title,
      description,
      type,
      department,
      color,
      startDate,
      endDate,
      startTime,
      endTime,
      isAllDay,
      location,
      status,
      reminder,
      attendeeIds,
    } = body;

    const db = getDb();
    let existingEvent: any = null;

    try {
      const [dbEvent] = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.id, id))
        .limit(1);
      existingEvent = dbEvent;
    } catch {
      existingEvent = getMockCalendarEvents().find((e) => e.id === id);
    }

    if (!existingEvent) {
      existingEvent = getMockCalendarEvents().find((e) => e.id === id);
    }

    if (!existingEvent) {
      return NextResponse.json({ error: "رویداد مورد نظر یافت نشد." }, { status: 404 });
    }

    // Role-based authorization check
    if (!canUserModifyEvent(session, existingEvent)) {
      return NextResponse.json(
        {
          error:
            "دسترسی غیرمجاز: شما اجازه ویرایش این رویداد را ندارید. (اعضای تیم تنها رویدادهای خود و راهبران واحد رویدادهای دپارتمان خود را می‌توانند ویرایش کنند)",
        },
        { status: 403 }
      );
    }

    const updatePayload: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updatePayload.title = title.trim();
    if (description !== undefined) updatePayload.description = description ? description.trim() : null;
    if (type !== undefined) updatePayload.type = type;
    if (department !== undefined) updatePayload.department = department;
    if (color !== undefined) updatePayload.color = color;
    if (startDate !== undefined) updatePayload.startDate = startDate;
    if (endDate !== undefined) updatePayload.endDate = endDate || startDate;
    if (startTime !== undefined) updatePayload.startTime = startTime;
    if (endTime !== undefined) updatePayload.endTime = endTime;
    if (isAllDay !== undefined) updatePayload.isAllDay = Boolean(isAllDay);
    if (location !== undefined) updatePayload.location = location ? location.trim() : null;
    if (status !== undefined) updatePayload.status = status;
    if (reminder !== undefined) updatePayload.reminder = reminder;

    try {
      const [updatedDbEvent] = await db
        .update(calendarEvents)
        .set(updatePayload)
        .where(eq(calendarEvents.id, id))
        .returning();

      // If attendeeIds were provided, update attendee records
      let updatedAttendees: any[] = [];
      if (Array.isArray(attendeeIds)) {
        await db.delete(calendarEventAttendees).where(eq(calendarEventAttendees.eventId, id));

        if (attendeeIds.length > 0) {
          const newAttendees = attendeeIds.map((empId: string) => ({
            eventId: id,
            employeeId: empId,
            role: "attendee",
            status: "pending",
          }));
          await db.insert(calendarEventAttendees).values(newAttendees);

          const employeesList = await db
            .select({
              id: employees.id,
              fullName: employees.fullName,
              department: employees.department,
              position: employees.position,
            })
            .from(employees)
            .where(inArray(employees.id, attendeeIds));

          updatedAttendees = employeesList.map((emp: any) => ({
            employeeId: emp.id,
            employeeName: emp.fullName,
            employeeDepartment: emp.department,
            position: emp.position,
            role: "attendee",
            status: "pending",
          }));
        }
      }

      const responseEvent = {
        ...updatedDbEvent,
        attendees: updatedAttendees,
      };

      updateMockCalendarEvent(id, responseEvent);

      return NextResponse.json({
        success: true,
        event: responseEvent,
      });
    } catch (dbErr: any) {
      console.warn("DB update failed, falling back to mock store:", dbErr);
      const updatedMock = updateMockCalendarEvent(id, {
        ...updatePayload,
        attendees: (attendeeIds || []).map((empId: string) => ({
          id: `att-${empId}`,
          employeeId: empId,
          employeeName: "عضو تیم",
          role: "attendee" as const,
          status: "pending" as const,
        })),
      });

      return NextResponse.json({
        success: true,
        event: updatedMock,
      });
    }
  } catch (err: any) {
    console.error("PUT /api/calendar/events/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "خطا در ویرایش رویداد" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const db = getDb();
    let existingEvent: any = null;

    try {
      const [dbEvent] = await db
        .select()
        .from(calendarEvents)
        .where(eq(calendarEvents.id, id))
        .limit(1);
      existingEvent = dbEvent;
    } catch {
      existingEvent = getMockCalendarEvents().find((e) => e.id === id);
    }

    if (!existingEvent) {
      existingEvent = getMockCalendarEvents().find((e) => e.id === id);
    }

    if (!existingEvent) {
      return NextResponse.json({ error: "رویداد مورد نظر یافت نشد." }, { status: 404 });
    }

    // Role-based authorization check
    if (!canUserModifyEvent(session, existingEvent)) {
      return NextResponse.json(
        {
          error:
            "دسترسی غیرمجاز: شما اجازه حذف این رویداد را ندارید. (اعضای تیم تنها رویدادهای خود و راهبران واحد رویدادهای دپارتمان خود را می‌توانند حذف کنند)",
        },
        { status: 403 }
      );
    }

    try {
      await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
    } catch (dbErr: any) {
      console.warn("DB delete failed, updating mock store:", dbErr);
    }

    deleteMockCalendarEvent(id);

    return NextResponse.json({
      success: true,
      message: "رویداد با موفقیت حذف گردید.",
    });
  } catch (err: any) {
    console.error("DELETE /api/calendar/events/[id] error:", err);
    return NextResponse.json(
      { error: err.message || "خطا در حذف رویداد" },
      { status: 500 }
    );
  }
}
