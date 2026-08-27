import { getDb } from "./client";
import { adminUsers, employees, dailyReports, reportItems } from "./schema";
import bcrypt from "bcryptjs";
import { getTehranDateString, generateLinkCode } from "../utils";

export async function seedDatabase() {
  const db = getDb();
  console.log("🌱 Starting seed...");

  try {
    // 1. Create Default Admin User
    const existingAdmin = await db.select().from(adminUsers).limit(1);
    if (existingAdmin.length === 0) {
      const passwordHash = await bcrypt.hash("admin123456", 10);
      await db.insert(adminUsers).values({
        email: "admin@rokad.ir",
        passwordHash,
        fullName: "مدیر ارشد رُکاد",
        role: "admin",
      });
      console.log("✅ Admin user created: admin@rokad.ir / admin123456");
    }

    // 2. Create Sample Employees if none exist
    const existingEmployees = await db.select().from(employees).limit(1);
    if (existingEmployees.length === 0) {
      const sampleStaff = [
        {
          fullName: "سارا محمدی",
          department: "فنی و توسعه",
          position: "توسعه‌دهنده فرانت‌اند",
          linkCode: generateLinkCode(),
          linkCodeExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
          telegramChatId: BigInt(12345678),
          isActive: true,
        },
        {
          fullName: "علی رضایی",
          department: "فنی و توسعه",
          position: "توسعه‌دهنده بک‌اند",
          linkCode: generateLinkCode(),
          linkCodeExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
          telegramChatId: BigInt(87654321),
          isActive: true,
        },
        {
          fullName: "مریم احمدی",
          department: "طراحی محصول",
          position: "طراح رابط کاربری UI/UX",
          linkCode: generateLinkCode(),
          linkCodeExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
          telegramChatId: BigInt(11223344),
          isActive: true,
        },
        {
          fullName: "امیرحسین شریفی",
          department: "مارکتینگ",
          position: "مدیر کمپین‌های دیجیتال",
          linkCode: generateLinkCode(),
          linkCodeExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
          telegramChatId: null,
          isActive: true,
        },
        {
          fullName: "نیلوفر کاظمی",
          department: "پشتیبانی و عملیات",
          position: "سرپرست پشتیبانی دانش‌آموزان",
          linkCode: generateLinkCode(),
          linkCodeExpiresAt: new Date(Date.now() + 24 * 3600 * 1000),
          telegramChatId: null,
          isActive: true,
        },
      ];

      const inserted = await db.insert(employees).values(sampleStaff).returning();
      console.log(`✅ Created ${inserted.length} sample employees.`);

      // 3. Create Sample Reports for Today
      const todayStr = getTehranDateString();

      // Report for Sara
      const sara = inserted[0];
      const rawSara = `/report\n1- پیاده‌سازی فرم لاگین جدید رُکاد - انجام شد\n2- اصلاح ریسپانسیو سایدبار در تبلت - انجام شد\n3- دیباگ هدر نوتیفیکیشن - ناقص مانده`;
      const [rep1] = await db
        .insert(dailyReports)
        .values({
          employeeId: sara.id,
          reportDate: todayStr,
          rawText: rawSara,
          status: "on_time",
          submittedAt: new Date(),
          editedCount: 0,
        })
        .returning();

      await db.insert(reportItems).values([
        {
          reportId: rep1.id,
          taskOrder: 1,
          description: "پیاده‌سازی فرم لاگین جدید رُکاد",
          status: "done",
        },
        {
          reportId: rep1.id,
          taskOrder: 2,
          description: "اصلاح ریسپانسیو سایدبار در تبلت",
          status: "done",
        },
        {
          reportId: rep1.id,
          taskOrder: 3,
          description: "دیباگ هدر نوتیفیکیشن",
          status: "incomplete",
        },
      ]);

      // Report for Ali
      const ali = inserted[1];
      const rawAli = `/report\n1- بهینه‌سازی کوئری‌های دیتابیس Neon - انجام شد\n2- تست وب‌هوک تلگرام روی سرور Vercel - انجام شد\n3- مستندسازی API های Swagger - لغو شد`;
      const [rep2] = await db
        .insert(dailyReports)
        .values({
          employeeId: ali.id,
          reportDate: todayStr,
          rawText: rawAli,
          status: "late",
          submittedAt: new Date(Date.now() - 30 * 60 * 1000),
          editedCount: 1,
        })
        .returning();

      await db.insert(reportItems).values([
        {
          reportId: rep2.id,
          taskOrder: 1,
          description: "بهینه‌سازی کوئری‌های دیتابیس Neon",
          status: "done",
        },
        {
          reportId: rep2.id,
          taskOrder: 2,
          description: "تست وب‌هوک تلگرام روی سرور Vercel",
          status: "done",
        },
        {
          reportId: rep2.id,
          taskOrder: 3,
          description: "مستندسازی API های Swagger",
          status: "cancelled",
        },
      ]);

      console.log("✅ Created sample daily reports & checklist items.");
    }

    console.log("🎉 Seeding completed successfully!");
  } catch (error) {
    console.error("Seed error:", error);
  }
}
