import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { markAllNotificationsAsRead } from "@/lib/notifications";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const employeeId = session.employeeId || session.userId;
    const success = await markAllNotificationsAsRead(employeeId);
    return NextResponse.json({ success });
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to mark all notifications as read", details: error.message },
      { status: 500 }
    );
  }
}
