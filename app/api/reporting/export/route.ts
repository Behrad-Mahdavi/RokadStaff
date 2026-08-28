import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { dailyReports, employees } from "@/lib/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
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

    // 2. Create Excel Workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Rokad Staff Platform";
    workbook.created = new Date();

    // Sheet 1: گزارش‌های روزانه کارکنان
    const sheet1 = workbook.addWorksheet("گزارش‌های روزانه کارکنان", {
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
      { header: "متن گزارش کار", key: "rawText", width: 60 },
    ];

    const headerRow = sheet1.getRow(1);
    headerRow.font = { name: "Tahoma", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    headerRow.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF59BBAF" },
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
        const cleanText = rep.rawText.replace(/^\/report\s*/i, "").trim();
        const row = sheet1.addRow({
          rowNum: idx + 1,
          fullName: rep.employeeFullName,
          dept: rep.employeeDepartment || "پسرانه",
          pos: rep.employeePosition || "-",
          dateJalali: formatToJalali(rep.reportDate),
          time: formatTehranTime(rep.submittedAt),
          statusFa: rep.status === "on_time" ? "به‌موقع" : "با تأخیر",
          rawText: cleanText,
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
      { header: "تعداد گزارش‌های ثبت‌شده", key: "submittedCount", width: 24 },
      { header: "گزارش‌های به‌موقع", key: "onTimeCount", width: 18 },
      { header: "گزارش‌های با تأخیر", key: "lateCount", width: 18 },
      { header: "درصد به‌موقع بودن", key: "onTimeRate", width: 18 },
    ];

    const headerRow2 = sheet2.getRow(1);
    headerRow2.font = { name: "Tahoma", size: 11, bold: true, color: { argb: "FFFFFFFF" } };
    headerRow2.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF202A5A" },
    };
    headerRow2.alignment = { vertical: "middle", horizontal: "center" };
    headerRow2.height = 28;

    const staffMap: Record<string, any> = {};
    filteredReports.forEach((rep) => {
      const empId = rep.employeeId;
      if (!staffMap[empId]) {
        staffMap[empId] = {
          fullName: rep.employeeFullName,
          dept: rep.employeeDepartment || "پسرانه",
          submittedCount: 0,
          onTimeCount: 0,
          lateCount: 0,
        };
      }
      staffMap[empId].submittedCount++;
      if (rep.status === "on_time") staffMap[empId].onTimeCount++;
      else staffMap[empId].lateCount++;
    });

    Object.values(staffMap).forEach((staff, idx) => {
      const onTimeRate =
        staff.submittedCount > 0
          ? `${Math.round((staff.onTimeCount / staff.submittedCount) * 100)}%`
          : "0%";

      const row = sheet2.addRow({
        rowNum: idx + 1,
        fullName: staff.fullName,
        dept: staff.dept,
        submittedCount: staff.submittedCount,
        onTimeCount: staff.onTimeCount,
        lateCount: staff.lateCount,
        onTimeRate,
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
