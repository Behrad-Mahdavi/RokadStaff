# بریف فنی و لاجیکال پروژه — Rokad Staff

> این سند فقط جنبه‌ی فنی/منطقی/برنامه‌نویسی پروژه را پوشش می‌دهد. دیزاین و UI جداگانه در `design.md` مدیریت می‌شود.

---

## ۱. معرفی پروژه

**Rokad Staff** پلتفرمی برای مدیریت کارکنان است که گزارش کار روزانه (چک‌لیست پایان روز) را از طریق ربات تلگرام دریافت، پردازش و در یک ادمین‌پنل تحت وب نمایش می‌دهد.

### هدف اصلی
ثبت خودکار و بدون اصطکاک گزارش کار روزانه‌ی کارکنان، بدون نیاز به نصب اپلیکیشن جداگانه، با استفاده از تلگرام به‌عنوان کانال ورودی.

### اجزای اصلی سیستم
1. **ربات تلگرام** — دریافت پیام‌های کارمندان (Webhook-based)
2. **Backend API** — پردازش Webhook، پارس گزارش، منطق کسب‌وکار
3. **دیتابیس (Neon Postgres)** — ذخیره‌سازی کارمندان، گزارش‌ها، آیتم‌های تسک
4. **ادمین‌پنل (Next.js روی Vercel)** — مدیریت کارکنان، مشاهده‌ی گزارش‌ها، آمار
5. **Cron Job** — یادآوری خودکار به کارکنانی که گزارش نداده‌اند

---

## ۲. Tech Stack

| لایه | تکنولوژی | دلیل انتخاب |
|---|---|---|
| Hosting / Serverless | Vercel | Serverless Functions + Cron Jobs بومی + Deploy ساده |
| Database | Neon (Postgres Serverless) | سازگار با محیط Serverless Vercel، اتصال سریع، Branching برای تست |
| Framework | Next.js (App Router) | یک‌پارچه‌سازی API Routes (وب‌هوک + پنل ادمین) در یک پروژه |
| ORM | Drizzle ORM (یا Prisma) | سبک‌تر برای Serverless؛ Prisma هم قابل قبول اگر تیم با آن راحت‌تر است |
| Bot Framework | grammY یا node-telegram-bot-api (در حالت Webhook، نه Polling) | grammY برای TypeScript و محیط Serverless مناسب‌تر است |
| Auth پنل ادمین | NextAuth.js یا Clerk | مدیریت نشست مدیر/سرپرست |
| زبان | TypeScript (سراسر پروژه) | Type Safety بین Bot Logic، API و DB Schema |
| Validation | Zod | اعتبارسنجی ورودی‌های API و پارس شده از تلگرام |

---

## ۳. معماری کلی

```
[کارمند در تلگرام]
        │  ارسال پیام /report ...
        ▼
[Telegram Bot API] ──Webhook POST──▶ /api/telegram/webhook (Vercel Function)
                                            │
                                            ▼
                                   [تشخیص نوع پیام: /link | /report | نامعتبر]
                                            │
                              ┌─────────────┼─────────────┐
                              ▼             ▼             ▼
                        [فلوی Link]   [فلوی Report]   [پاسخ خطا به کاربر]
                              │             │
                              ▼             ▼
                        [Neon DB: employees]  [Neon DB: daily_reports + report_items]
                                            │
                                            ▼
                                 [ادمین‌پنل Next.js می‌خواند و نمایش می‌دهد]

[Vercel Cron - روزانه ساعت مشخص]
        │
        ▼
[بررسی کارمندانی که گزارش نداده‌اند] ──▶ [ارسال پیام یادآوری از طریق Telegram Bot API]
```

نکته‌ی معماری مهم: Telegram Webhook و پنل ادمین هر دو در **یک پروژه‌ی Next.js واحد** روی Vercel قرار می‌گیرند (نه دو پروژه‌ی جدا)، چون اشتراک مستقیم در Schema دیتابیس و کد Type دارند. مسیر وب‌هوک صرفاً یک Route API در همان پروژه است.

---

## ۴. مدل داده (Database Schema)

### جدول `employees`
```sql
CREATE TABLE employees (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       TEXT NOT NULL,
    department      TEXT,
    position        TEXT,
    telegram_chat_id BIGINT UNIQUE,          -- تا وقتی link نشده NULL است
    link_code       VARCHAR(6),              -- کد یکبارمصرف برای اتصال
    link_code_expires_at TIMESTAMPTZ,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_employees_telegram_chat_id ON employees(telegram_chat_id);
```

### جدول `daily_reports`
```sql
CREATE TABLE daily_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES employees(id),
    report_date     DATE NOT NULL,           -- تاریخ شمسی/میلادی؟ (باید مشخص شود)
    raw_text        TEXT NOT NULL,           -- متن خام پیام تلگرام - همیشه نگه‌داری شود
    status          TEXT NOT NULL DEFAULT 'on_time', -- on_time | late
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    edited_count    INT NOT NULL DEFAULT 0,  -- چند بار جایگزین شده
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(employee_id, report_date)         -- هر کارمند فقط یک گزارش فعال در روز
);

CREATE INDEX idx_daily_reports_employee_date ON daily_reports(employee_id, report_date);
```

### جدول `report_items`
```sql
CREATE TABLE report_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id       UUID NOT NULL REFERENCES daily_reports(id) ON DELETE CASCADE,
    task_order      INT NOT NULL,
    description     TEXT NOT NULL,
    status          TEXT NOT NULL,           -- done | incomplete | cancelled
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_report_items_report_id ON report_items(report_id);
```

### جدول `report_history` (Audit Trail برای گزارش‌های جایگزین‌شده)
```sql
CREATE TABLE report_history (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_report_id UUID NOT NULL,
    employee_id     UUID NOT NULL REFERENCES employees(id),
    raw_text        TEXT NOT NULL,
    replaced_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### جدول `admin_users` (کاربران پنل مدیریت)
```sql
CREATE TABLE admin_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,
    role            TEXT NOT NULL DEFAULT 'admin', -- admin | supervisor (برای فاز ۲)
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### جدول `bot_message_log` (اختیاری ولی به‌شدت پیشنهادی برای دیباگ)
```sql
CREATE TABLE bot_message_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    telegram_chat_id BIGINT,
    raw_update      JSONB NOT NULL,          -- کل payload وب‌هوک تلگرام
    processed_ok    BOOLEAN,
    error_message   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
> دلیل وجود این جدول: وقتی وب‌هوک شکست بخورد یا پارس خطا بدهد، بدون این لاگ هیچ راهی برای دیباگ نداری چون تلگرام payload اصلی را دوباره نمی‌فرستد.

---

## ۵. فرمت پیام و منطق پارس (Bot Logic)

### فرمت استاندارد پیام گزارش
```
/report
1- شرح تسک اول - انجام شد
2- شرح تسک دوم - ناقص مانده
3- شرح تسک سوم - لغو شد
```

### قوانین پارس (Regex Rules)
- خط اول باید دقیقاً `/report` باشد (بدون فاصله‌ی اضافه، case-insensitive بگیر برای اطمینان بیشتر).
- هر خط بعدی باید با الگوی زیر مچ شود:
  ```regex
  ^\s*(\d+)[-.]\s*(.+?)\s*-\s*(انجام شد|ناقص مانده|لغو شد)\s*$
  ```
- گروه‌های Regex:
  - گروه ۱: شماره‌ی ترتیب تسک (اعتبارسنجی: باید صعودی و بدون تکرار باشد، ولی الزامی نیست دقیقاً پشت‌سرهم باشد)
  - گروه ۲: توضیح تسک
  - گروه ۳: وضعیت (باید دقیقاً یکی از سه مقدار مجاز باشد)

### الگوریتم پردازش پیام ورودی
```
1. دریافت Update از تلگرام (POST به /api/telegram/webhook)
2. ثبت خام Update در bot_message_log
3. استخراج chat_id از پیام
4. جستجوی employee با telegram_chat_id = chat_id
   4.1. اگر پیدا نشد و پیام /link نیست → ارسال پیام "ابتدا با /link کد_شما حساب خود را متصل کنید"
5. اگر پیام با /link شروع می‌شود → اجرای فلوی Link (بخش ۶)
6. اگر پیام با /report شروع می‌شود:
   6.1. Split متن بر اساس خط
   6.2. رد کردن خط اول (/report)
   6.3. برای هر خط باقیمانده: تست با Regex
       - اگر مچ نشد → توقف پردازش کل پیام، ارسال خطا شامل شماره‌ی خط مشکل‌دار، عدم ذخیره در دیتابیس (Atomic - همه یا هیچ)
   6.4. اگر همه‌ی خطوط معتبر بودند:
       - بررسی: آیا گزارشی با همین employee_id و report_date (امروز) از قبل وجود دارد؟
           - دارد → کپی گزارش قبلی در report_history، سپس UPDATE گزارش فعلی (جایگزینی کامل) + افزایش edited_count
           - ندارد → INSERT رکورد جدید در daily_reports
       - DELETE تمام report_items مربوط به این report_id (اگر جایگزینی است) و INSERT مجدد آیتم‌ها
       - تعیین status بر اساس ساعت ارسال (بخش ۷ - قانون ساعت کاری)
   6.5. ارسال پیام تأیید به کارمند شامل خلاصه‌ی گزارش ثبت‌شده (بازخورد فوری تا کارمند مطمئن شود درست ثبت شده)
7. اگر پیام هیچ‌کدام از موارد بالا نبود → ارسال راهنمای فرمت صحیح
```

> **نکته‌ی حیاتی طراحی:** پردازش پیام باید Atomic باشد — یعنی اگر حتی یک خط از چک‌لیست فرمت غلط داشت، **هیچ بخشی** از گزارش ذخیره نشود و کل پیام رد شود با پیام خطای واضح. ذخیره‌ی نصفه‌ونیمه بدترین حالت ممکن است چون کارمند فکر می‌کند گزارش کامل ثبت شده.

---

## ۶. فلوی Link کردن حساب کارمند

```
1. ادمین در پنل، کارمند جدید می‌سازد (نام، دپارتمان، سمت)
2. سیستم یک کد ۶ رقمی تصادفی تولید می‌کند (link_code) با انقضای مثلاً ۲۴ ساعت (link_code_expires_at)
3. ادمین کد را (خارج از سیستم - مثلاً حضوری یا پیام داخلی) به کارمند می‌دهد
4. کارمند در تلگرام به ربات پیام می‌دهد: /link 483920
5. Backend:
   5.1. جستجوی employee با link_code = '483920' AND link_code_expires_at > NOW()
   5.2. پیدا نشد یا منقضی شده → پیام خطا "کد نامعتبر یا منقضی شده، با مدیر خود تماس بگیرید"
   5.3. پیدا شد:
       - بررسی: آیا این telegram_chat_id از قبل به یک employee دیگر متصل است؟ (باید رد شود - جلوگیری از یک تلگرام = چند هویت)
       - UPDATE employees SET telegram_chat_id = chat_id, link_code = NULL, link_code_expires_at = NULL
       - ارسال پیام خوش‌آمد + راهنمای فرمت /report
```

### Edge Case های این فلو
- کارمند کد را دو بار استفاده کند → چون link_code بعد از مصرف NULL می‌شود، بار دوم خطای "کد نامعتبر" می‌گیرد (رفتار صحیح).
- دو کارمند مختلف بخواهند با یک Telegram Account لینک شوند → باید رد شود؛ خطای صریح برگردد.
- ادمین بخواهد یک کارمند را دوباره لینک کند (مثلاً گوشی عوض کرده) → باید در پنل امکان "تولید مجدد کد" و "قطع اتصال فعلی" وجود داشته باشد.

---

## ۷. قوانین کسب‌وکار (Business Rules)

### قانون ساعت کاری / تأخیر
- باید یک مقدار پیکربندی‌پذیر برای "ساعت پایان کار" وجود داشته باشد (مثلاً در جدول تنظیمات یا Environment Variable).
- اگر `submitted_at` بعد از این ساعت باشد → `status = 'late'` (فقط جهت گزارش‌گیری، نه رد کردن پیام).
- این ساعت باید per-department قابل تنظیم باشد یا سراسری؟ **(سؤال باز - نیاز به تصمیم کارفرما)**

### قانون منطقه‌ی زمانی (Timezone)
- تمام `TIMESTAMPTZ` ها در UTC ذخیره می‌شوند؛ نمایش و محاسبه‌ی "امروز" باید بر اساس Timezone ایران (`Asia/Tehran`) در لایه‌ی Application انجام شود، نه در دیتابیس.
- محاسبه‌ی `report_date` (چه روزی این گزارش برای آن روز حساب می‌شود) باید بر اساس نیمه‌شب Asia/Tehran انجام شود، نه UTC — وگرنه گزارش ساعت ۱ بامداد به تاریخ اشتباه می‌خورد.

### قانون جایگزینی گزارش
- کارمند تا پایان همان روز (`report_date`) می‌تواند گزارش را با ارسال مجدد `/report` جایگزین کند.
- بعد از تغییر روز (نیمه‌شب Tehran)، ارسال `/report` رکورد **جدید** برای روز جدید می‌سازد؛ گزارش روز قبل دیگر قابل ویرایش نیست.

### قانون کارمند غیرفعال (`is_active = false`)
- اگر کارمندی در پنل غیرفعال شود، ربات باید همچنان به پیام‌هایش پاسخ دهد اما با پیام "حساب شما غیرفعال شده، با مدیر تماس بگیرید" و **ذخیره نکند**.

### قانون یادآوری (Cron)
- Vercel Cron هر روز در ساعت مشخص (مثلاً ۱۷:۳۰ به وقت تهران) اجرا می‌شود.
- کوئری: تمام `employees` با `is_active = true` که `telegram_chat_id` دارند AND در `daily_reports` برای `report_date = امروز` رکورد ندارند.
- برای هرکدام پیام یادآوری ارسال شود (با Rate Limit مناسب برای جلوگیری از محدودیت API تلگرام - نکته‌ی بخش ۹).

---

## ۸. API Endpoints (پنل ادمین)

| Method | Route | توضیح |
|---|---|---|
| `POST` | `/api/telegram/webhook` | دریافت آپدیت از تلگرام (تنها ورودی از بیرون به سیستم بات) |
| `POST` | `/api/employees` | ایجاد کارمند جدید + تولید link_code |
| `GET` | `/api/employees` | لیست کارمندان (با فیلتر دپارتمان/وضعیت) |
| `PATCH` | `/api/employees/:id` | ویرایش کارمند (نام، دپارتمان، is_active) |
| `POST` | `/api/employees/:id/regenerate-link-code` | تولید مجدد کد اتصال |
| `POST` | `/api/employees/:id/unlink` | قطع اتصال تلگرام کارمند |
| `GET` | `/api/reports` | لیست گزارش‌ها (فیلتر: تاریخ، کارمند، دپارتمان، وضعیت) |
| `GET` | `/api/reports/:id` | جزئیات یک گزارش + آیتم‌هایش |
| `GET` | `/api/reports/missing?date=` | لیست کارمندانی که در تاریخ مشخص گزارش نداده‌اند |
| `GET` | `/api/dashboard/summary` | آمار کلی (فاز ۲ - نرخ تکمیل، تسک‌های ناقص و ...) |
| `POST` | `/api/cron/reminder` | Endpoint فراخوانی‌شده توسط Vercel Cron |

> همه‌ی Route های بالا به‌جز `/api/telegram/webhook` و `/api/cron/reminder` باید پشت Auth پنل ادمین باشند.

---

## ۹. امنیت (Security Considerations)

1. **اعتبارسنجی وب‌هوک تلگرام**: تلگرام امکان تنظیم `secret_token` روی Webhook را می‌دهد؛ این توکن باید در Header هر درخواست چک شود تا کسی نتواند مستقیماً به Endpoint وب‌هوک درخواست جعلی بزند.
2. **محافظت از `/api/cron/reminder`**: این Route باید فقط توسط Vercel Cron قابل فراخوانی باشد (با یک Header Secret اختصاصی که در Environment Variable ذخیره می‌شود، نه هارد-کد).
3. **Rate Limiting برای ارسال پیام تلگرام**: Telegram Bot API محدودیت نرخ دارد (تقریباً ۳۰ پیام بر ثانیه به Chat های مختلف). در Cron یادآوری، پیام‌ها باید با تأخیر کوچک بین هر ارسال (batch + delay) فرستاده شوند تا خطای `429 Too Many Requests` نگیری.
4. **جلوگیری از SQL Injection**: چون از ORM استفاده می‌شود (Drizzle/Prisma)، این ریسک به‌صورت پیش‌فرض پوشش داده می‌شود؛ اما هرگز Query خام با String Concatenation نباید نوشته شود.
5. **حریم خصوصی داده**: `telegram_chat_id` و متن خام گزارش‌ها داده‌ی حساس محسوب می‌شوند؛ دسترسی به آن‌ها باید محدود به نقش Admin/Supervisor باشد.
6. **Environment Variables** (هرگز در کد Commit نشوند):
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_WEBHOOK_SECRET`
   - `DATABASE_URL` (Neon connection string)
   - `CRON_SECRET`
   - `NEXTAUTH_SECRET` (یا معادل Auth)

---

## ۱۰. مدیریت خطا و لاگ (Error Handling & Observability)

- هر درخواست ورودی به وب‌هوک باید در `bot_message_log` ثبت شود، **قبل از** شروع پردازش — تا حتی در صورت کرش کامل تابع، رد پیام باقی بماند.
- خطاهای پارس باید هم به کاربر (پیام تلگرام) و هم در `bot_message_log.error_message` ثبت شوند.
- توصیه می‌شود از یک سرویس مانیتورینگ خطا (مثل Sentry) در لایه‌ی Backend استفاده شود، مخصوصاً چون Vercel Function Logs بعد از مدتی از دسترس خارج می‌شوند.
- Health Check ساده: یک Route (`/api/health`) که وضعیت اتصال به Neon را چک کند - برای اطمینان از سالم بودن سرویس بعد از هر Deploy.

---

## ۱۱. تقویم اجرا / Scope Slicing

### فاز ۱ (MVP)
- [ ] مدل داده کامل (بخش ۴) روی Neon
- [ ] وب‌هوک تلگرام + فلوی `/link`
- [ ] فلوی `/report` با پارس متن آزاد + ذخیره Atomic
- [ ] پیام تأیید فوری به کارمند بعد از ثبت
- [ ] ادمین‌پنل حداقلی: لیست کارمندان (CRUD ساده) + لیست گزارش‌های روزانه با فیلتر تاریخ/کارمند
- [ ] Auth ساده برای ادمین‌پنل

### فاز ۲
- [ ] Cron یادآوری خودکار
- [ ] گزارش کارمندانی که ارسال نکرده‌اند (`missing reports`)
- [ ] داشبورد آماری (نرخ تکمیل تسک، روند هفتگی/ماهانه)
- [ ] Audit Trail کامل (`report_history`) در UI قابل مشاهده
- [ ] خروجی Excel از گزارش‌ها

### فاز ۳ (خارج از Scope فعلی - فقط برای آگاهی)
- [ ] نقش Supervisor با دسترسی محدود به دپارتمان خودش
- [ ] تأیید/رد گزارش توسط سرپرست
- [ ] انتقال از متن آزاد به Inline Keyboard (اگر بعداً کیفیت داده مهم‌تر از سرعت توسعه شد)

---

## ۱۲. سؤالات باز که باید قبل از شروع کدنویسی پاسخ داده شوند

1. ساعت پایان کار رسمی برای محاسبه‌ی `status = late` چند است و آیا برای همه‌ی دپارتمان‌ها یکسان است؟
2. آیا نیاز به چند نقش در پنل ادمین هست (مثلاً Super Admin و Supervisor) یا فاز ۱ فقط یک نقش Admin کافی است؟
3. زبان و فرمت دقیق تاریخ در پنل: شمسی یا میلادی؟ (این روی نمایش UI اثر دارد، نه ذخیره‌سازی که همیشه باید استاندارد بماند)
4. آیا امکان دارد یک کارمند در چند دپارتمان هم‌زمان باشد یا رابطه ۱ به ۱ کافی است؟
5. سقف تعداد کارمندان مورد انتظار در فاز اول چقدر است؟ (برای برآورد نیاز به Connection Pooling در Neon)

---

## ۱۳. ساختار پیشنهادی پوشه‌بندی پروژه

```
rokad-staff/
├── app/
│   ├── api/
│   │   ├── telegram/webhook/route.ts
│   │   ├── cron/reminder/route.ts
│   │   ├── employees/route.ts
│   │   ├── employees/[id]/route.ts
│   │   ├── reports/route.ts
│   │   └── reports/[id]/route.ts
│   ├── (admin)/
│   │   ├── employees/page.tsx
│   │   ├── reports/page.tsx
│   │   └── dashboard/page.tsx
│   └── login/page.tsx
├── lib/
│   ├── db/
│   │   ├── schema.ts        (Drizzle Schema)
│   │   └── client.ts        (Neon connection)
│   ├── telegram/
│   │   ├── bot.ts           (تنظیمات Bot instance)
│   │   ├── parser.ts        (منطق Regex پارس گزارش)
│   │   └── handlers/
│   │       ├── link.ts
│   │       └── report.ts
│   └── auth/
├── drizzle/                 (Migration files)
└── vercel.json               (تنظیمات Cron)
```

---

این سند صرفاً منطق و معماری فنی را پوشش می‌دهد؛ برای شروع پیاده‌سازی، پیشنهاد می‌شود ابتدا به سؤالات باز بخش ۱۲ پاسخ داده شود چون مستقیماً روی Schema و منطق فاز ۱ اثر می‌گذارند.