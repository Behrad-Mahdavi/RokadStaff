import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  getNotificationsForUser,
  createNotification,
  NotificationCategory,
} from "@/lib/notifications";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") || undefined;
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  try {
    const employeeId = session.employeeId || session.userId;
    const { notifications, unreadCount } = await getNotificationsForUser(
      employeeId,
      category,
      unreadOnly
    );

    return NextResponse.json({
      notifications,
      unreadCount,
    });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, message, category, type, link, recipientId, metadata } = body;

    if (!title || !message || !category || !type) {
      return NextResponse.json(
        { error: "Missing required fields: title, message, category, type" },
        { status: 400 }
      );
    }

    const created = await createNotification({
      title,
      message,
      category: category as NotificationCategory,
      type,
      link,
      recipientId: recipientId || undefined,
      senderId: session.employeeId || session.userId || undefined,
      metadata,
    });

    return NextResponse.json({ notification: created }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification", details: error.message },
      { status: 500 }
    );
  }
}
