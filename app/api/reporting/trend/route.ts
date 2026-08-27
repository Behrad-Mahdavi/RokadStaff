import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { dailyStats } from "@/lib/db/schema";
import { and, gte, lte, isNull, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getTehranDateString, formatToJalali } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const metric = searchParams.get("metric") || "completionRate"; // completionRate | onTimeRate | taskCompletionRatio
    const groupBy = searchParams.get("groupBy") || "day"; // day | week | month

    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 14);
    const fromParam = searchParams.get("from") || getTehranDateString(defaultFrom);
    const toParam = searchParams.get("to") || getTehranDateString();

    let department = searchParams.get("department");
    if (session.role === "supervisor" && (session as any).assignedDepartment) {
      department = (session as any).assignedDepartment;
    }

    const db = getDb();
    const conditions = [
      gte(dailyStats.statDate, fromParam),
      lte(dailyStats.statDate, toParam),
    ];

    if (department && department !== "all") {
      conditions.push(eq(dailyStats.department, department));
    } else {
      conditions.push(isNull(dailyStats.department));
    }

    const stats: any[] = await db
      .select()
      .from(dailyStats)
      .where(and(...conditions))
      .orderBy(dailyStats.statDate);

    // Map time-series data points
    const points = stats.map((s: any) => {
      let value = 0;
      if (metric === "completionRate") {
        value = s.activeEmployees > 0 ? Math.round((s.submittedCount / s.activeEmployees) * 100) : 0;
      } else if (metric === "onTimeRate") {
        value = s.submittedCount > 0 ? Math.round((s.onTimeCount / s.submittedCount) * 100) : 0;
      } else if (metric === "taskCompletionRatio") {
        value = s.totalTaskItems > 0 ? Math.round((s.doneTaskItems / s.totalTaskItems) * 100) : 0;
      }

      return {
        date: s.statDate,
        dateJalali: formatToJalali(s.statDate),
        value,
        submittedCount: s.submittedCount,
        activeEmployees: s.activeEmployees,
        onTimeCount: s.onTimeCount,
        lateCount: s.lateCount,
        totalTasks: s.totalTaskItems,
        doneTasks: s.doneTaskItems,
      };
    });

    return NextResponse.json({
      metric,
      groupBy,
      from: fromParam,
      to: toParam,
      points,
    });
  } catch (error: any) {
    console.error("Trend error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
