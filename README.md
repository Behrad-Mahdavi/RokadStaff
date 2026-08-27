# سامانه رُکاد‌استاف (Rokad Staff)

سامانه مدیریت و پایش گزارش کار روزانه (چک‌لیست پایان روز) کارکنان از طریق ربات تلگرام و پنل مدیریت تحت وب.

---

## 🌟 ویژگی‌های کلیدی

1. **کانال ورودی بدون اصطکاک (تلگرام):**
   - دریافت خودکار گزارش‌ها از طریق دستور `/report` با Webhook در قالب Serverless.
   - احراز هویت و اتصال امن حساب کاربری با کد ۶ رقمی یکبارمصرف (`/link 123456`).
   - پردازش اتمیک (Atomic) متن گزارش و ارسال بازخورد و خلاصه تسک‌ها به کاربر.
   - امکان ویرایش و اصلاح گزارش تا پایان همان روز با ثبت تاریخچه تغییرات (Audit Trail).

2. **سیستم طراحی اختصاصی رُکاد (Rokad Design System):**
   - پیاده‌سازی پالت‌های ۵ گانه شخصیتی برند (اکوسیستم، پسر، دختر، کالج، کلوپ).
   - استایل‌های Hard Shadow برند رُکاد، تایپوگرافی فارسی، و ساختار کاملاً راست‌چین (RTL).

3. **پنل مدیریت پیشرفته (Admin Panel):**
   - **داشبورد تحلیلی:** نرخ مشارکت روزانه، تفکیک به‌موقع / با تأخیر، نرخ انجام تسک‌ها، وضعیت مشارکت دپارتمان‌ها.
   - **مدیریت کارکنان:** ثبت کارمند، تولید خودکار کد اتصال ۶ رقمی، صدور مجدد کد، قطع اتصال، فعال/غیرفعال‌سازی.
   - **کاوشگر گزارش‌ها:** فیلتر بر اساس تقویم جلالی، کارمند، دپارتمان و وضعیت، مشاهده آیتم‌های تسک و متن خام ارسالی.
   - **پایش غایبان:** مشاهده لیست افرادی که گزارش نداده‌اند + امکان ارسال یادآوری فوری.
   - **شبیه‌ساز و راهنمای بات:** محیط تست زنده اعتبارسنجی Regex پیام‌های تلگرام.

4. **زمان‌بندی و یادآوری خودکار (Cron Job):**
   - کران جاب خودکار (پایان ساعت کاری) جهت ارسال پیام هشدار به کارمندانی که هنوز گزارش خود را ثبت نکرده‌اند.

---

## 🛠 Tech Stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Database:** Neon Postgres (Serverless)
- **ORM:** Drizzle ORM
- **Telegram Engine:** grammY (Webhook Mode)
- **Styling:** Tailwind CSS + Rokad Design System Tokens
- **Date Engine:** Jalali Date (`jalaali-js`) + `Asia/Tehran` Timezone
- **Auth:** Secure JWT Session Cookies

---

## 🚀 راهنمای راه‌اندازی و اجرا

### ۱. نصب وابستگی‌ها
```bash
npm install
```

### ۲. تنظیم متغیرهای محیطی
یک فایل `.env.local` در ریشه پروژه بسازید (مطابق با `.env.example`):
```env
# اتصال دیتابیس Neon
DATABASE_URL="postgres://user:password@ep-sample.region.neon.tech/rokad_staff?sslmode=require"

# توکن ربات تلگرام (از @BotFather)
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_WEBHOOK_SECRET="your_random_secret"

# کلیدهای امنیتی سشن و کران جاب
CRON_SECRET="your_cron_secret"
JWT_SECRET="your_jwt_secret_min_32_characters"

# تنظیمات ساعت کاری
WORK_END_HOUR="18:00"
APP_TIMEZONE="Asia/Tehran"
```

### ۳. ساخت ساختار دیتابیس (Migrations)
```bash
npx drizzle-kit push
```

### ۴. بارگذاری داده‌های اولیه تستی
```bash
npm run db:seed
```
> **اطلاعات ورود ادمین پیش‌فرض:**
> - ایمیل: `admin@rokad.ir`
> - رمز عبور: `admin123456`

### ۵. اجرای سرور توسعه
```bash
npm run dev
```
سامانه در آدرس `http://localhost:3000` در دسترس خواهد بود.

---

## 🤖 تنظیم وب‌هوک تلگرام روی Vercel

پس از Deploy پروژه روی Vercel، کافی است دستور زیر را با توکن و آدرس دامنه خود در ترمینال اجرا کنید:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
     -H "Content-Type: application/json" \
     -d '{
       "url": "https://your-domain.vercel.app/api/telegram/webhook",
       "secret_token": "<TELEGRAM_WEBHOOK_SECRET>"
     }'
```
