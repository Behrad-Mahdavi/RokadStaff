# بریف فنی و لاجیکال ماژول Rotello Staff (مدیریت پروژه / کانبان)

> این سند مکمل `rokad-staff-dev-brief.md` و `rokad-staff-reporting-module-brief.md` است. دیزاین در `design.md` جداست — این سند فقط منطق، مدل داده، API و Edge Case هاست.

---

## ۱. جایگاه Rotello Staff نسبت به Rokad Staff — قبل از هر چیز روشن شود

این نکته حیاتی است چون در پروژه‌ی اصلی دو مفهوم شبیه به هم داریم که **نباید با هم قاطی شوند**:

| | Rokad Staff (موجود) | Rotello Staff (این ماژول) |
|---|---|---|
| هدف | گزارش کار روزانه‌ی خودگزارش‌ده | مدیریت واقعی تسک‌ها و پروژه‌ها |
| ورودی داده | تلگرام (متن آزاد) | پنل وب (فرم ساختاریافته) |
| واحد اصلی | `daily_reports` (یک گزارش کلی روزانه) | `tasks` (واحد مجزا و قابل ردیابی) |
| "گزارش" در این سیستم یعنی | کل چک‌لیست روز | یک ثبت خط‌زمانی روی یک تسک خاص (`task_reports`) |
| هویت کارمند | فقط `telegram_chat_id`، بدون نیاز به ورود به پنل | باید بتواند وارد یک **میز کار شخصی در وب** شود |

**نتیجه‌ی مهم معماری:** چون Rotello Staff نیاز به "میز کار شخصی اعضا" دارد، دیگر کافی نیست کارمند فقط یک `telegram_chat_id` داشته باشد — او باید بتواند **وارد پنل وب شود و هویتش احراز شود**. این بزرگ‌ترین تغییر زیرساختی این فاز است و در بخش ۲ باز شده.

هر دو ماژول از همان جدول `employees` به‌عنوان منبع واحد هویت کارکنان استفاده می‌کنند — یعنی یک کارمند، یک رکورد، هم در تلگرام گزارش روزانه می‌دهد هم در Rotello Staff تسک دارد. **جدول `employees` نباید برای این ماژول کپی یا دوباره ساخته شود.**

---

## ۲. احراز هویت اعضا برای ورود به پنل (پیش‌نیاز اجباری)

چون قبلاً کارمند هیچ Session/Login در وب نداشت (فقط شناسه‌ی تلگرام)، باید یکی از دو مسیر انتخاب شود:

### گزینه‌ی پیشنهادی: ورود با تلگرام (Login via Telegram — بدون رمز عبور)
با توجه به اینکه هر کارمند از قبل `telegram_chat_id` معتبر دارد (از فلوی `/link` که ساخته شده)، به‌جای ساخت یک سیستم Password جدید:

1. کارمند در صفحه‌ی ورود پنل، شماره‌ی پرسنلی یا نامش را وارد می‌کند (یا دکمه "دریافت لینک ورود" را می‌زند)
2. بک‌اند یک **توکن یکبارمصرف کوتاه‌عمر** (مثلاً ۱۰ دقیقه) می‌سازد و از طریق همان ربات تلگرام موجود، لینک ورود (Magic Link) را به `telegram_chat_id` او ارسال می‌کند
3. کارمند روی لینک در تلگرام کلیک می‌کند → وارد پنل با یک Session معتبر می‌شود

**چرا این روش بهتر است؟**
- زیرساخت ارسال پیام تلگرام از قبل آماده است (بات موجود است) — نیازی به SMS Gateway یا Email Provider جدید نیست
- کارمند نیازی به به‌خاطر سپردن رمز عبور ندارد
- ریسک امنیتی رمز عبور ضعیف/تکراری حذف می‌شود

### گزینه‌ی جایگزین: Email/Password استاندارد
اگر سازمان ترجیح می‌دهد کارمندان مستقل از تلگرام هم بتوانند وارد شوند (مثلاً از سیستم شخصی)، باید فیلد `email` و `password_hash` به `employees` اضافه شود و یک فلوی Reset Password استاندارد پیاده‌سازی شود. **این تصمیم باید قبل از شروع کدنویسی این ماژول گرفته شود** (سؤال باز شماره ۱).

### جدول جدید مورد نیاز
```sql
CREATE TABLE login_tokens (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id     UUID NOT NULL REFERENCES employees(id),
    token           TEXT UNIQUE NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    used_at         TIMESTAMPTZ,              -- NULL یعنی هنوز استفاده نشده
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
> `used_at` باید بعد از اولین استفاده پر شود تا توکن دوباره‌مصرف‌شدنی نباشد (همان الگوی امنیتی `link_code` در ماژول قبلی).

---

## ۳. مدل نقش‌ها (Roles) در Rotello Staff

سه سطح دسترسی، مجزا از نقش‌های ادمین‌پنل Rokad Staff (که فقط برای مدیریت کارمندان/گزارش روزانه بود):

| نقش | تعریف | دامنه |
|---|---|---|
| **Owner / Manager سراسری** | همان `admin_users` موجود، یا کارمندی با فلگ خاص | تمام پروژه‌ها؛ می‌تواند پروژه بسازد/حذف کند، تسک هر پروژه را ویرایش/حذف کند |
| **Project Manager (مدیر پروژه)** | یک `employee` که در یک پروژه‌ی خاص نقش مدیر دارد | فقط همان پروژه؛ می‌تواند تسک‌های آن پروژه را بسازد/ویرایش/حذف کند، عضو اضافه/حذف کند |
| **Member (عضو عادی)** | هر `employee` که به یک پروژه اضافه شده | فقط دیدن پروژه، انجام کار روی تسک‌های خودش (تیک‌زدن چک‌لیست، ثبت Task Report)؛ **حق ویرایش/حذف تسک را ندارد** |

نکته‌ی طراحی مهم: نقش **per-project** است، نه سراسری — یعنی یک نفر می‌تواند در پروژه‌ی A مدیر باشد و در پروژه‌ی B فقط عضو عادی. این باید در جدول رابط `project_members` مدل شود (بخش ۴).

---

## ۴. مدل داده‌ی کامل

### جدول `projects` (بوردها)
```sql
CREATE TABLE projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            TEXT NOT NULL,
    description     TEXT,
    created_by      UUID NOT NULL REFERENCES employees(id),
    is_archived     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### جدول `project_members` (نقش هر عضو در هر پروژه)
```sql
CREATE TABLE project_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    employee_id     UUID NOT NULL REFERENCES employees(id),
    role            TEXT NOT NULL DEFAULT 'member',  -- 'manager' | 'member'
    added_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(project_id, employee_id)
);
```

### جدول `board_columns` (ستون‌های کانبان — قابل تنظیم per-project)
```sql
CREATE TABLE board_columns (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,             -- مثلاً "برای انجام"، "در حال انجام"، "بازبینی"، "انجام‌شده"
    position        FLOAT NOT NULL,            -- ترتیب نمایش ستون‌ها (بخش ۵ برای منطق ordering)
    is_done_column  BOOLEAN NOT NULL DEFAULT FALSE, -- مشخص می‌کند ورود تسک به این ستون یعنی "تکمیل"
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
> `is_done_column` مهم است چون داشبورد تحلیلی (بخش ۱۲) باید بداند کدام ستون معادل "تسک تمام‌شده" است، بدون فرض ثابت روی نام ستون (چون نام‌ها Customizable هستند).

### جدول `tasks`
```sql
CREATE TABLE tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    column_id       UUID NOT NULL REFERENCES board_columns(id),
    title           TEXT NOT NULL,
    description     TEXT,
    deadline         TIMESTAMPTZ,
    priority        TEXT NOT NULL DEFAULT 'normal',  -- 'normal' | 'important' | 'urgent'
    position        FLOAT NOT NULL,            -- ترتیب داخل ستون
    created_by      UUID NOT NULL REFERENCES employees(id),
    is_deleted      BOOLEAN NOT NULL DEFAULT FALSE,  -- Soft Delete - بخش ۹
    deleted_at      TIMESTAMPTZ,
    deleted_by      UUID REFERENCES employees(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_project_column ON tasks(project_id, column_id) WHERE is_deleted = FALSE;
CREATE INDEX idx_tasks_deadline ON tasks(deadline) WHERE is_deleted = FALSE;
```

### جدول `task_assignees` (Multi-Assignee)
```sql
CREATE TABLE task_assignees (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    employee_id     UUID NOT NULL REFERENCES employees(id),
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
    assigned_by     UUID NOT NULL REFERENCES employees(id),

    UNIQUE(task_id, employee_id)
);

CREATE INDEX idx_task_assignees_employee ON task_assignees(employee_id);
```

### جدول `checklists` (چک‌لیست‌های چندگانه)
```sql
CREATE TABLE checklists (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,             -- مثلاً "مرحله طراحی"، "مرحله تست"
    position        FLOAT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### جدول `checklist_items`
```sql
CREATE TABLE checklist_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id    UUID NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    position        FLOAT NOT NULL,
    is_done         BOOLEAN NOT NULL DEFAULT FALSE,
    done_by         UUID REFERENCES employees(id),   -- کارمندی که تیک زده
    done_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_checklist_items_checklist ON checklist_items(checklist_id);
```

### جدول `task_reports` (تایم‌لاین Append-only)
```sql
CREATE TABLE task_reports (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES employees(id),
    content         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
    -- عمداً هیچ ستون updated_at وجود ندارد؛ این جدول باید Append-only باشد (بخش ۸)
);

CREATE INDEX idx_task_reports_task ON task_reports(task_id, created_at);
```

### جدول `task_activity_log` (رویدادهای سیستمی، جدا از Task Reports دستی)
```sql
CREATE TABLE task_activity_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    actor_id        UUID NOT NULL REFERENCES employees(id),
    action_type     TEXT NOT NULL,   -- created | moved_column | assignee_added | assignee_removed | edited | deleted | checklist_item_checked
    metadata        JSONB,           -- جزئیات مثل {"from_column":"...","to_column":"..."}
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
```
> این جدول از `task_reports` مجزاست: `task_reports` گزارش **دستی و روایی** کارمند است ("امروز این بخش را انجام دادم")، ولی `task_activity_log` رویدادهای **خودکار سیستمی** است (چه کسی چه زمانی تسک را جابه‌جا کرد). قاطی کردن این دو، هم منطق Append-only را می‌شکند و هم UI تایم‌لاین را شلوغ می‌کند.

---

## ۵. منطق جابجایی و ترتیب (Kanban Drag & Drop / Position Algorithm)

### مشکل رایج
اگر ترتیب تسک‌ها را با عدد صحیح (`1, 2, 3, ...`) نگه داری، هر بار جابجایی یک تسک بین دو تسک دیگر نیاز به Re-index کردن همه‌ی رکوردهای بعدی دارد — روی دیتابیس پرترافیک این باعث Race Condition و کندی می‌شود.

### راه‌حل: Position به‌صورت عدد اعشاری (Fractional Indexing)
- وقتی تسکی بین دو تسک با `position = 100` و `position = 200` قرار می‌گیرد، `position` جدید برابر با میانگین (`150`) محاسبه می‌شود.
- این یعنی فقط **یک UPDATE** لازم است، نه Re-index کل ستون.
- مقداردهی اولیه: هر تسک جدید در انتهای ستون با `position = آخرین_position + 1000` قرار می‌گیرد (فاصله‌ی بزرگ اولیه برای جا باز کردن Insert های بعدی).
- Edge Case: اگر به‌خاطر Insert های مکرر بین دو مقدار، فاصله به‌قدری کم شود که دقت اعشاری Float کفایت نکند (به‌ندرت اتفاق می‌افتد ولی باید پیش‌بینی شود) → یک Job پس‌زمینه‌ی نادر باید کل ستون را Re-index کند (Normalize به فواصل ۱۰۰۰تایی).

همین منطق دقیقاً برای `board_columns.position` و `checklists.position` و `checklist_items.position` هم تکرار می‌شود.

### جابجایی تسک بین ستون‌ها (نه فقط جابجایی داخل یک ستون)
وقتی تسک از ستون A به ستون B منتقل می‌شود:
1. `UPDATE tasks SET column_id = B, position = <محاسبه‌شده در ستون B> WHERE id = task_id`
2. ثبت رکورد در `task_activity_log` با `action_type = 'moved_column'`
3. اگر ستون مقصد `is_done_column = true` باشد → این رویداد باید برای محاسبه‌ی متریک "زمان تکمیل تسک" در داشبورد ثبت شود (نیاز به ذخیره‌ی `completed_at` روی خود تسک — پیشنهاد: ستون `completed_at TIMESTAMPTZ` به جدول `tasks` اضافه شود که هر بار ورود/خروج از Done Column آپدیت می‌شود)

---

## ۶. منطق مودال ساخت/ویرایش تسک

### فیلدهای اجباری در ساخت
- `title` (اجباری، حداقل طول مثلاً ۳ کاراکتر)
- `column_id` (پیش‌فرض: اولین ستون پروژه)
- `priority` (پیش‌فرض: `normal` اگر انتخاب نشود)

### فیلدهای اختیاری
- `description`, `deadline`

### اعتبارسنجی (Zod Schema پیشنهادی - مفهومی)
```
title: string, min 3, max 200
description: string, optional, max 5000
deadline: datetime, optional, باید >= امروز باشد در حالت ساخت (نه لزوماً در ویرایش - ممکن است مدیر بخواهد ددلاین گذشته را برای آرشیو ثبت کند)
priority: enum('normal', 'important', 'urgent')
assignee_ids: array of UUID, باید همگی عضو همان project باشند (اعتبارسنجی سمت سرور - بخش ۱۰ Edge Case)
```

### تفاوت رفتار Create و Edit
- در Create: یک رکورد `task_activity_log` با `action_type='created'` ثبت می‌شود.
- در Edit: باید مشخص شود **کدام فیلدها تغییر کرده‌اند** و برای هرکدام (یا حداقل مجموع تغییرات) یک رکورد `action_type='edited'` با `metadata` شامل فیلدهای تغییریافته ثبت شود — این برای شفافیت در تایم‌لاین ضروری است (مثلاً "مدیر X ددلاین را از ۱۴۰۵/۰۵/۱۰ به ۱۴۰۵/۰۵/۱۵ تغییر داد").

---

## ۷. منطق Multi-Assignee

- هنگام ساخت/ویرایش تسک، لیست `assignee_ids` کامل جایگزین می‌شود (نه Append) — یعنی سرور تفاوت بین لیست قدیم و جدید را محاسبه می‌کند:
  - افرادی که در لیست جدید هستند ولی قبلاً نبودند → INSERT در `task_assignees` + رکورد `assignee_added` در Activity Log + (اختیاری) ارسال پیام تلگرام به آن‌ها
  - افرادی که در لیست قدیم بودند ولی در جدید نیستند → DELETE از `task_assignees` + رکورد `assignee_removed`
- **قانون مهم:** حذف یک Assignee از تسک، چک‌مارک‌های `checklist_items.done_by` که قبلاً توسط او ثبت شده را **پاک نمی‌کند** — تاریخچه‌ی انجام کار باید دست‌نخورده بماند حتی اگر آن فرد از تسک برداشته شود.
- محدودیت: هر Assignee باید عضو `project_members` همان پروژه باشد (نمی‌توان کارمندی از بیرون پروژه را مستقیم Assign کرد بدون اینکه ابتدا به پروژه اضافه شود).

---

## ۸. منطق چک‌لیست‌های چندگانه

- هر تسک می‌تواند ۰ تا N چک‌لیست داشته باشد؛ هر چک‌لیست عنوان مستقل و آیتم‌های خودش را دارد.
- **چه کسی حق تیک‌زدن دارد؟** طبق نیازمندی ("تیک‌زدن مرحله‌ای توسط مسئولین")، فقط کسانی که در `task_assignees` آن تسک هستند (یا Project Manager/Owner) مجاز به تغییر `is_done` هستند — عضوی که Assignee نیست فقط می‌تواند مشاهده کند.
- هنگام تیک‌زدن: `is_done=true`, `done_by=<کاربر جاری>`, `done_at=NOW()`. هنگام برداشتن تیک: به نظر منطقی است `done_by` و `done_at` پاک شوند (چون دیگر معتبر نیستند)، اما این خودش یک تصمیم Product است — جایگزین این است که آخرین `done_by/done_at` را نگه داری برای Audit ولو تیک برداشته شده (سؤال باز شماره ۲).
- **محاسبه‌ی درصد پیشرفت تسک**: `(مجموع is_done=true در همه‌ی checklist_items مربوط به آن task) / (کل checklist_items آن task) × ۱۰۰`. این عدد باید Real-time محاسبه شود (تعداد آیتم‌ها معمولاً کم است، نیازی به Pre-aggregation نیست بر خلاف ماژول گزارش‌گیری).
- Edge Case: تسکی با صفر چک‌لیست/آیتم — درصد پیشرفت باید `null` یا `—` نمایش داده شود، نه صفر (چون صفر به‌اشتباه به‌معنای "هیچ‌کاری انجام نشده" تفسیر می‌شود در حالی‌که اصلاً چک‌لیستی تعریف نشده).

---

## ۹. منطق Task Reports (تایم‌لاین Append-only)

### الزام Append-only — چطور در سطح سیستم تضمین می‌شود؟
صرفاً "عدم ساخت Endpoint برای UPDATE/DELETE" کافی نیست، چون دسترسی مستقیم به دیتابیس (یا یک باگ آینده در کد) می‌تواند این قانون را بشکند. دو لایه‌ی محافظت پیشنهاد می‌شود:

1. **لایه‌ی Application**: هیچ Route ای برای `PATCH` یا `DELETE` روی `task_reports` تعریف نشود (فقط `POST` برای ساخت و `GET` برای خواندن).
2. **لایه‌ی دیتابیس (محکم‌تر)**: یک `REVOKE UPDATE, DELETE ON task_reports FROM <role_ای که Application با آن به DB وصل می‌شود>` یا یک Trigger که هر `UPDATE`/`DELETE` را با Exception رد کند. این تضمین می‌کند حتی یک باگ در کد Backend هم نتواند این قانون را بشکند.

### محتوای هر Task Report
- `author_id` (از Session کاربر لاگین‌کرده گرفته می‌شود، هرگز از Body درخواست خوانده نشود — جلوگیری از جعل هویت نویسنده)
- `content` (متن آزاد گزارش)
- `created_at` (توسط دیتابیس ست می‌شود، نه Client — جلوگیری از جعل زمان)

### چه کسی می‌تواند Task Report ثبت کند؟
منطقی‌ترین حالت: هر عضوی که `task_assignees` آن تسک است، یا Project Manager/Owner. عضو غیرمرتبط با تسک نباید بتواند روی آن گزارش ثبت کند.

---

## ۱۰. ویرایش و حذف تسک — کنترل دسترسی و Soft Delete

### چه کسی مجاز است؟
طبق نیازمندی ("توسط مدیر")، فقط **Project Manager همان پروژه** یا **Owner سراسری** مجاز به Edit/Delete هستند؛ Member عادی حتی اگر Assignee باشد، نمی‌تواند تسک را حذف یا ویرایش کلی کند (تیک‌زدن چک‌لیست و ثبت Task Report جزو "ویرایش تسک" محسوب نمی‌شود و مجاز است).

### چرا Soft Delete (`is_deleted`) به‌جای DELETE واقعی؟
- تسک حذف‌شده ممکن است در `daily_stats`/داشبورد تحلیلی (تسک‌های تکمیل‌شده، آمار Cycle Time) قبلاً محاسبه شده باشد؛ حذف فیزیکی داده‌ی تاریخی را خراب می‌کند.
- `task_reports` و `checklist_items` مرتبط با یک تسک حذف‌شده باید همچنان برای Audit در دسترس بمانند، نه با `ON DELETE CASCADE` واقعی از بین بروند.
- در همه‌ی Query های عادی (نمایش بورد، میز کار شخصی)، شرط `WHERE is_deleted = FALSE` باید همیشه اعمال شود؛ فقط یک View مخصوص Owner (اختیاری، فاز بعد) می‌تواند تسک‌های حذف‌شده را برای بازیابی نشان دهد.

### چه اتفاقی برای Assignee ها و Notification می‌افتد؟
هنگام حذف تسک، پیشنهاد می‌شود به همه‌ی Assignee های آن (از طریق تلگرام، چون `telegram_chat_id` موجود است) اطلاع داده شود که تسکشان حذف شده — جلوگیری از سردرگمی "تسکم کجا رفت؟".

---

## ۱۱. میز کار شخصی اعضا (Personal Workspace)

این صفحه Cross-Project است — یعنی یک عضو تسک‌هایش را از **همه‌ی پروژه‌هایی که در آن‌ها عضو است** در یک‌جا می‌بیند، نه بورد به بورد.

### کوئری منطقی
```
SELECT t.* FROM tasks t
JOIN task_assignees ta ON ta.task_id = t.id
WHERE ta.employee_id = <کاربر جاری>
  AND t.is_deleted = FALSE
  AND (project غیر آرشیوشده باشد، مگر کاربر فیلتر "آرشیو" را انتخاب کرده باشد)
ORDER BY
  -- اولویت‌بندی پیشنهادی: ددلاین نزدیک‌تر و اولویت بالاتر بالاتر بیایند
  CASE priority WHEN 'urgent' THEN 1 WHEN 'important' THEN 2 ELSE 3 END,
  deadline ASC NULLS LAST
```

### گروه‌بندی پیشنهادی در UI (منطق Backend، نه دیزاین)
- تسک‌های عقب‌افتاده (`deadline < NOW() AND column.is_done_column = FALSE`)
- امروز/این هفته
- بدون ددلاین
- تکمیل‌شده اخیر (برای حس رضایت از پیشرفت)

### اعلان‌های شخصی (اختیاری، فاز ۲ همین ماژول)
لیست رویدادهای مرتبط با کاربر که باید به او Push/نمایش داده شود: تسک جدید Assign شده، Task Report جدید روی تسکی که او هم Assignee است، نزدیک شدن ددلاین (مثلاً ۲۴ ساعت مانده) — این‌ها می‌توانند از طریق همان بات تلگرام موجود ارسال شوند (استفاده‌ی مجدد از زیرساخت، بدون نیاز به سیستم Push جدید).

---

## ۱۲. داشبورد تحلیلی و نظارتی مدیر

### متریک‌های پیشنهادی و فرمول دقیق

| متریک | محاسبه |
|---|---|
| **تسک‌های باز به تفکیک اولویت** | `COUNT(tasks) WHERE is_deleted=FALSE AND column.is_done_column=FALSE GROUP BY priority` |
| **تسک‌های عقب‌افتاده (Overdue)** | `COUNT(tasks) WHERE deadline < NOW() AND column.is_done_column = FALSE AND is_deleted=FALSE` |
| **میانگین زمان تکمیل تسک** | `AVG(completed_at - created_at)` روی تسک‌هایی که `completed_at IS NOT NULL` |
| **توزیع بار کاری (Workload)** | `COUNT(task_assignees) GROUP BY employee_id` به‌همراه فیلتر "فقط تسک‌های باز" — برای دیدن اینکه چه کسی زیر فشار بیش‌ازحد است |
| **سلامت پروژه (Project Health)** | ترکیبی از: نسبت Overdue به کل، میانگین زمان بلاتکلیف ماندن تسک در یک ستون (Cycle Time)، فاز بعد |

> **به‌روزرسانی:** فیلد امتیاز (`points`) از این ماژول کاملاً حذف شده است — نه در `tasks` وجود دارد، نه در داشبورد تحلیلی. اگر در فازهای بعدی نیاز به یک سیستم انگیزشی/امتیازدهی مطرح شود، پیشنهاد می‌شود به‌عنوان یک ماژول کاملاً مستقل طراحی شود، نه ستون مستقیم روی `tasks` — چون قوانین امتیازدهی (تقسیم بین Multi-Assignee، وزن‌دهی بر اساس اولویت و ...) به‌مرور پیچیده می‌شوند و بهتر است از منطق تسک جدا بمانند.

### چرا این بخش نباید مثل ماژول گزارش‌گیری حتماً Pre-aggregate شود؟
برخلاف `daily_stats` که روی حجم زیاد گزارش تاریخی کار می‌کرد، این متریک‌ها اغلب روی **تسک‌های باز فعلی** محاسبه می‌شوند که حجمشان محدود و کنترل‌شده است (یک سازمان معمولاً همزمان صدها نه میلیون‌ها تسک باز ندارد). بنابراین Live Query با Index مناسب (`idx_tasks_project_column`, `idx_tasks_deadline`) کافی است. فقط اگر در آینده تعداد پروژه‌ها/تسک‌های تاریخی بسیار زیاد شود، همان الگوی Pre-aggregation ماژول قبلی قابل تکرار است.

---

## ۱۳. API Endpoints

| Method | Route | توضیح |
|---|---|---|
| `POST` | `/api/auth/request-login-link` | ارسال Magic Link از طریق تلگرام (بخش ۲) |
| `GET` | `/api/auth/verify?token=` | اعتبارسنجی توکن و ساخت Session |
| `POST` | `/api/projects` | ساخت پروژه‌ی جدید (فقط Owner) |
| `GET` | `/api/projects` | لیست پروژه‌هایی که کاربر جاری عضو آن‌هاست |
| `PATCH` | `/api/projects/:id` | ویرایش پروژه (نام/آرشیو) |
| `POST` | `/api/projects/:id/members` | افزودن عضو به پروژه + تعیین نقش |
| `DELETE` | `/api/projects/:id/members/:employeeId` | حذف عضو از پروژه |
| `POST` | `/api/projects/:id/columns` | ساخت ستون کانبان جدید |
| `PATCH` | `/api/columns/:id` | ویرایش ستون (نام، `is_done_column`، جابجایی) |
| `POST` | `/api/tasks` | ساخت تسک |
| `PATCH` | `/api/tasks/:id` | ویرایش تسک (شامل جابجایی ستون/موقعیت) |
| `DELETE` | `/api/tasks/:id` | حذف تسک (Soft Delete) |
| `POST` | `/api/tasks/:id/assignees` | جایگزینی کامل لیست Assignee ها |
| `POST` | `/api/tasks/:id/checklists` | ساخت چک‌لیست جدید روی تسک |
| `PATCH` | `/api/checklists/:id` | ویرایش عنوان/ترتیب چک‌لیست |
| `POST` | `/api/checklists/:id/items` | افزودن آیتم به چک‌لیست |
| `PATCH` | `/api/checklist-items/:id` | تغییر `is_done` یا عنوان یا ترتیب |
| `POST` | `/api/tasks/:id/reports` | ثبت Task Report جدید (Append-only) |
| `GET` | `/api/tasks/:id/reports` | خواندن تایم‌لاین گزارش‌ها + Activity Log ترکیبی |
| `GET` | `/api/workspace/my-tasks` | میز کار شخصی کاربر جاری |
| `GET` | `/api/dashboard/rotello-summary` | متریک‌های بخش ۱۲ |

> نکته: `PATCH /api/tasks/:id` باید هم برای تغییر فیلدهای عادی (عنوان، توضیحات، ددلاین، اولویت) و هم جابجایی Drag & Drop (`column_id`, `position`) استفاده شود، اما این دو نوع درخواست باید در Activity Log با `action_type` متفاوت (`edited` در برابر `moved_column`) ثبت شوند — نباید هر PATCH فقط یک لاگ عمومی "edited" بزند چون اطلاعات مفیدی برای Timeline از دست می‌رود.

---

## ۱۴. تصمیم‌های نهایی (جایگزین سؤالات باز قبلی)

### ۱. سیستم امتیازدهی — حذف کامل
تصمیم گرفته شد که این ماژول **هیچ مفهوم امتیازی نداشته باشد**. در نتیجه:
- ستون `points` از جدول `tasks` حذف شد (بخش ۴ به‌روزرسانی شد).
- متریک "Points Leaderboard" از داشبورد تحلیلی (بخش ۱۲) حذف شد.
- اگر در آینده نیاز به انگیزش/امتیازدهی مطرح شود، باید به‌صورت ماژول مستقل طراحی شود، نه بازگشت مستقیم ستون به `tasks`.

### ۲. روش احراز هویت اعضا → **Magic Link از طریق تلگرام**
همان‌طور که در بخش ۲ پیشنهاد شد، این مسیر نهایی است: کارمند نام/کد پرسنلی خود را در صفحه‌ی ورود وارد می‌کند، لینک ورود یکبارمصرف با انقضای ۱۰ دقیقه از طریق بات موجود برایش ارسال می‌شود. دلیل انتخاب: از زیرساخت بات موجود استفاده می‌شود، نیازی به مدیریت رمز عبور/Reset Password نیست، و تجربه‌ی کاربری برای کارمندی که از قبل با تلگرام کار می‌کند طبیعی‌تر است. جدول `login_tokens` (بخش ۲) طبق همین تصمیم نهایی است.

### ۳. دسترسی ساخت تسک برای اعضای عادی → **مجاز است**
هر عضوی که در `project_members` آن پروژه باشد (چه `manager` چه `member`) می‌تواند تسک جدید بسازد. دلیل: محدود کردن ساخت تسک فقط به مدیر یک گلوگاه غیرضروری ایجاد می‌کند — عضوی که کار جدیدی شناسایی کرده باید بتواند بلافاصله آن را ثبت کند. **محدودیت همچنان پابرجاست:** فقط Manager/Owner می‌تواند تسک را ویرایش کلی یا حذف کند (بخش ۱۰ بدون تغییر). یعنی یک Member می‌تواند تسک بسازد ولی بعد از ساخت، توانایی ویرایش/حذف آن را مثل بقیه ندارد مگر خودش Manager باشد — این نامتقارن بودن باید در UI به‌وضوح روشن شود تا کارمند گیج نشود.

### ۴. رفتار برداشتن تیک چک‌لیست → **حفظ آخرین مقدار برای Audit**
وقتی `is_done` از `true` به `false` تغییر می‌کند، `done_by` و `done_at` **پاک نمی‌شوند** — آخرین فردی که تیک زده بود و زمانش، به‌عنوان "آخرین تعامل" نگه داشته می‌شود، فقط `is_done=false` می‌شود. اگر بعداً دوباره تیک بخورد، این دو فیلد با مقدار جدید Overwrite می‌شوند. دلیل: این ساده‌ترین راه برای حفظ ارزش Audit بدون نیاز به یک جدول تاریخچه‌ی جداگانه برای هر آیتم چک‌لیست است (که برای این سطح از جزئیات overkill خواهد بود).

### ۵. تسک‌های پروژه‌ی آرشیوشده در میز کار شخصی → **پیش‌فرض مخفی**
وقتی پروژه‌ای آرشیو می‌شود، تسک‌های باز آن به‌صورت پیش‌فرض از میز کار شخصی (بخش ۱۱) حذف می‌شوند تا لیست کاری کارمند شلوغ نشود. یک فیلتر جداگانه ("نمایش پروژه‌های آرشیوشده") در همان صفحه باید وجود داشته باشد که در صورت فعال شدن، این تسک‌ها را با یک برچسب بصری "آرشیو شده" نشان دهد (خود برچسب بخش دیزاین است، ولی فلگ `project.is_archived` که در کوئری بخش ۱۱ استفاده می‌شود از قبل در Schema موجود است).

### ۶. هماهنگی Rate Limit اعلان‌های تلگرامی بین دو ماژول
چون Rotello Staff هم (برای Assign شدن، نزدیک شدن ددلاین) و هم Rokad Staff (یادآوری گزارش روزانه) از یک بات مشترک برای ارسال پیام استفاده می‌کنند، باید یک **صف ارسال پیام مشترک** (Single Outbound Queue) در سطح کل پروژه پیاده‌سازی شود، نه اینکه هر ماژول جدا مستقیم به Telegram Bot API پیام بزند. این صف مسئول رعایت محدودیت نرخ ارسال تلگرام (بخش ۹ سند اصلی) به‌صورت یکپارچه برای کل سیستم است، صرف‌نظر از اینکه پیام از کدام ماژول آمده.

---

## ۱۵. خلاصه‌ی جداول جدید مورد نیاز (برای Migration)

```
login_tokens
projects
project_members
board_columns
tasks
task_assignees
checklists
checklist_items
task_reports
task_activity_log
```

هیچ‌کدام از جداول موجود Rokad Staff (`employees`, `daily_reports`, `report_items`, `admin_users`, `daily_stats`) نیازی به تغییر ساختاری ندارند — فقط `employees` به‌عنوان Foreign Key مرجع در همه‌جا استفاده می‌شود.