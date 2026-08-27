import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { dailyReports, employees, reportItems } from "@/lib/db/schema";
import { eq, and, desc, inArray, gte, lte } from "drizzle-orm";
import { getSession } from "@/lib/auth/session";
import { formatToJalali, formatTehranTime, getTehranDateString } from "@/lib/utils";
import ExcelJS from "exceljs";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const todayStr = getTehranDateString();

    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);
    const fromParam = searchParams.get("from") || getTehranDateString(defaultFrom);
    const toParam = searchParams.get("to") || todayStr;

    // Safety limit: max 90 days per export (Section 9)
    const dFrom = new Date(fromParam);
    const dTo = new Date(toParam);
    const diffDays = Math.ceil((dTo.getTime() - dFrom.getTime()) / (1000 * 3600 * 24));
    if (diffDays > 90) {
      return NextResponse.json(
        { error: "حداکثر بازه مجاز برای خروجی اکسل ۹۰ روز است." },
        { status: 400 }
      );
    }

    let department = searchParams.get("department");
    if (session.role === "supervisor" && (session as any).assignedDepartment) {
      department = (session as any).assignedDepartment;
    }

    const db = getDb();

    // 1. Fetch reports
    const conditions = [
      gte(dailyReports.reportDate, fromParam),
      lte(dailyReports.reportDate, toParam),
    ];

    const reportsQuery = db
      .select({
        id: dailyReports.id,
        employeeId: dailyReports.employeeId,
        reportDate: dailyReports.reportDate,
        rawText: dailyReports.rawText,
        status: dailyReports.status,
        submittedAt: dailyReports.submittedAt,
        editedCount: dailyReports.editedCount,
        employeeFullName: employees.fullName,
        employeeDepartment: employees.department,
        employeePosition: employees.position,
      })
      .from(dailyReports)
      .innerJoin(employees, eq(dailyReports.employeeId, employees.id))
      .where(and(...conditions))
      .orderBy(desc(dailyReports.reportDate), desc(dailyReports.submittedAt));

    const reports: any[] = await reportsQuery;
    const filteredReports = department && department !== "all"
      ? reports.filter((r: any) => r.employeeDepartment === department)
      : reports;

    // 2. Fetch items
    const reportIds = filteredReports.map((r: any) => r.id);
    let itemsByReportId: Record<string, any[]> = {};

    if (reportIds.length > 0) {
      const items: any[] = await db
        .select()
        .from(reportItems)
        .where(inArray(reportItems.reportId, reportIds))
        .orderBy(reportItems.taskOrder);

      for (const item of items) {
        if (!itemsByReportId[item.reportId]) {
          itemsByReportId[item.reportId] = [];
        }
        itemsByReportId[item.reportId].push(item);
      }
    }

    // 3. Create Excel Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Rokad Staff Platform";
    workbook.created = new Date();

    // Sheet 1: گزارش‌های تفصیلی روزانه
    const sheet1 = workbook.addWorksheet("گزارش‌های تفصیلی روزانه", {
      views: [{ rightToLeft: true }],
    });

    sheet1.columns = [
      { header: "ردیف", key: "rowNum", width: 8 },
      { header: "نام کارمند", key: "fullName", width: 22 },
      { header: "دپارتمان", key: "dept", width: 18 },
      { header: "سمت شغلی", key: "pos", width: 20 },
      { header: "تاریخ شمسی", key: "dateJalali", width: 15 },
      { header: "ساعت ثبت", key: "time", width: 12 },
      { header: "وضعیت ارسال", key: "statusFa", width: 14 },
      { header: "کل تسک‌ها", key: "totalTasks", width: 12 },
      { header: "انجام شد", key: "doneTasks", width: 12 },
      { header: "ناقص مانده", key: "incompleteTasks", width: 12 },
      { header: "لغو شد", key: "cancelledTasks", width: 12 },
      { header: "نرخ تکمیل", key: "rate", width: 14 },
      { header: "متن خام ارسالی", key: "rawText", width: 45 },
    ];

    // Style header row
    const headerRow = sheet1.getRow(1);
    headerRow.font = { name: "Tahoma", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF59BBAF" }, // Brand primary color
    };
    headerRow.alignment = { vertical: "middle", horizontal: "center" };
    headerRow.height = 28;

    if (filteredReports.length === 0) {
      sheet1.addRow({
        rowNum: 1,
        fullName: "داده‌ای در بازه زمانی انتخابی یافت نشد.",
      });
    } else {
      filteredReports.forEach((rep, idx) => {
        const items = itemsByReportId[rep.id] || [];
        const done = items.filter((i) => i.status === "done").length;
        const incomplete = items.filter((i) => i.status === "incomplete").length;
        const cancelled = items.filter((i) => i.status === "cancelled").length;
        const rate = items.length > 0 ? `${Math.round((done / items.length) * 100)}%` : "0%";

        const row = sheet1.addRow({
          rowNum: idx + 1,
          fullName: rep.employeeFullName,
          dept: rep.employeeDepartment || "عمومی",
          pos: rep.employeePosition || "-",
          dateJalali: formatToJalali(rep.reportDate),
          time: formatTehranTime(rep.submittedAt),
          statusFa: rep.status === "on_time" ? "به‌موقع" : "با تأخیر",
          totalTasks: items.length,
          doneTasks: done,
          incompleteTasks: incomplete,
          cancelledTasks: cancelled,
          rate,
          rawText: rep.rawText,
        });

        row.font = { name: "Tahoma", size: 10 };
        row.alignment = { vertical: "middle", horizontal: "right" };
        if (idx % 2 === 1) {
          row.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF9FBFB" },
          };
        }
      });
    }

    // Sheet 2: خلاصه عملکرد کارکنان
    const sheet2 = workbook.addWorksheet("خلاصه عملکرد کارکنان", {
      views: [{ rightToLeft: true }],
    });

    sheet2.columns = [
      { header: "ردیف", key: "rowNum", width: 8 },
      { header: "نام کارمند", key: "fullName", width: 22 },
      { header: "دپارتمان", key: "dept", width: 18 },
      { header: "تعداد گزارش‌های ثبت‌شده", key: "submittedCount", width: 22 },
      { header: "گزارش‌های به‌موقع", key: "onTimeCount", width: 18 },
      { header: "گزارش‌های با تأخیر", key: "lateCount", width: 18 },
      { header: "درصد به‌موقع بودن", key: "onTimeRate", width: 18 },
      { header: "مجموع تسک‌های ثبت‌شده", key: "totalTasks", width: 22 },
      { header: "تسک‌های انجام‌شده", key: "doneTasks", width: 18 },
      { header: "نرخ انجام تسک‌ها", key: "taskRate", width: 18 },
    ];

    const headerRow2 = sheet2.getRow(1);
    headerRow2.font = { name: "Tahoma", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    headerRow2.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF202A5A" }, // Brand male / secondary color
    };
    headerRow2.alignment = { vertical: "middle", horizontal: "center" };
    headerRow2.height = 28;

    // Aggregate by employee
    const staffMap: Record<string, any> = {};
    filteredReports.forEach((rep) => {
      const empId = rep.employeeId;
      if (!staffMap[empId]) {
        staffMap[empId] = {
          fullName: rep.employeeFullName,
          dept: rep.employeeDepartment || "عمومی",
          submittedCount: 0,
          onTimeCount: 0,
          lateCount: 0,
          totalTasks: 0,
          doneTasks: 0,
        };
      }
      staffMap[empId].submittedCount++;
      if (rep.status === "on_time") staffMap[empId].onTimeCount++;
      else staffMap[empId].lateCount++;

      const items = itemsByReportId[rep.id] || [];
      staffMap[empId].totalTasks += items.length;
      staffMap[empId].doneTasks += items.filter((i) => i.status === "done").length;
    });

    Object.values(staffMap).forEach((staff, idx) => {
      const onTimeRate =
        staff.submittedCount > 0
          ? `${Math.round((staff.onTimeCount / staff.submittedCount) * 100)}%`
          : "0%";
      const taskRate =
        staff.totalTasks > 0
          ? `${Math.round((staff.doneTasks / staff.totalTasks) * 100)}%`
          : "0%";

      const row = sheet2.addRow({
        rowNum: idx + 1,
        fullName: staff.fullName,
        dept: staff.dept,
        submittedCount: staff.submittedCount,
        onTimeCount: staff.onTimeCount,
        lateCount: staff.lateCount,
        onTimeRate,
        totalTasks: staff.totalTasks,
        doneTasks: staff.doneTasks,
        taskRate,
      });

      row.font = { name: "Tahoma", size: 10 };
      row.alignment = { vertical: "middle", horizontal: "right" };
    });

    // Generate buffer in-memory
    const buffer = await workbook.xlsx.writeBuffer();

    const fileName = `rokad_staff_report_${fromParam}_to_${toParam}.xlsx`;

    return new Response(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error("Excel Export error:", error);
    return NextResponse.json({ error: error.message || "Export error" }, { status: 500 });
  }
}
