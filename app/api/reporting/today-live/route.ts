import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { dailyReports, employees } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { getTehranDateString } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const todayStr = getTehranDateString();
    const db = getDb();

    const { searchParams } = new URL(req.url);
    let department = searchParams.get("department");
    if (session.role === "supervisor" && (session as any).assignedDepartment) {
      department = (session as any).assignedDepartment;
    }

    // 1. All active employees
    const allEmployees: any[] = await db.select().from(employees);
    let activeEmployees = allEmployees.filter((e: any) => e.isActive);
    if (department && department !== "all") {
      activeEmployees = activeEmployees.filter((e: any) => e.department === department);
    }

    // 2. Today's submitted reports
    const todayReportsQuery = db
      .select({
        id: dailyReports.id,
        employeeId: dailyReports.employeeId,
        status: dailyReports.status,
        submittedAt: dailyReports.submittedAt,
        employeeDepartment: employees.department,
      })
      .from(dailyReports)
      .innerJoin(employees, eq(dailyReports.employeeId, employees.id))
      .where(eq(dailyReports.reportDate, todayStr));

    const todayReports: any[] = await todayReportsQuery;
    const filteredReports = department && department !== "all"
      ? todayReports.filter((r: any) => r.employeeDepartment === department)
      : todayReports;

    const onTimeCount = filteredReports.filter((r: any) => r.status === "on_time").length;
    const lateCount = filteredReports.filter((r: any) => r.status === "late").length;
    const submittedCount = filteredReports.length;
    const missingCount = Math.max(0, activeEmployees.length - submittedCount);

    const completionRate =
      activeEmployees.length > 0
        ? Math.round((submittedCount / activeEmployees.length) * 100)
        : 0;

    return NextResponse.json({
      todayDate: todayStr,
      department: department || "all",
      activeEmployees: activeEmployees.length,
      submittedCount,
      missingCount,
      onTimeCount,
      lateCount,
      completionRate,
    });
  } catch (error: any) {
    console.error("Live reporting error:", error);
    return NextResponse.json({ error: error.message || "Server error" }, { status: 500 });
  }
}
