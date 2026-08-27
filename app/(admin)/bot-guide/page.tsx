"use client";

import React, { useState } from "react";
import {
  Bot,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  Play,
  Copy,
  Check,
  Sparkles,
  Info,
  ShieldCheck,
} from "lucide-react";
import { parseReportMessage } from "@/lib/telegram/parser";
import { toPersianDigits } from "@/lib/utils";

const SAMPLE_TEMPLATES = [
  {
    title: "نمونه گزارش استاندارد (معتبر)",
    text: `/report
1- طراحی پروتوتایپ رابط کاربری - انجام شد
2- کدنویسی اندپوینت‌های وب‌هوک تلگرام - انجام شد
3- اتصال به پایگاه داده Neon - ناقص مانده`,
  },
  {
    title: "نمونه با وضعیت لغو شده (معتبر)",
    text: `/report
1- بررسی تسک‌های تیم مارکتینگ - انجام شد
2- جلسه هفتگی همگام‌سازی - لغو شد
3- رفع باگ‌های امنیتی سشن - انجام شد`,
  },
  {
    title: "نمونه با خطای نگارشی در وضعیت (نامعتبر)",
    text: `/report
1- نگارش مستندات فنی پروژه - اوکی شد
2- تست پرفورمنس کوئری‌ها - انجام شد`,
  },
  {
    title: "نمونه بدون شماره ترتیب (نامعتبر)",
    text: `/report
پیاده‌سازی پنل مدیریت - انجام شد`,
  },
];

export default function BotGuidePage() {
  const [testText, setTestText] = useState(SAMPLE_TEMPLATES[0].text);
  const [copied, setCopied] = useState<number | null>(null);

  const parseResult = parseReportMessage(testText);

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-bold text-club-normal mb-1">
          <Bot className="w-4 h-4" />
          <span>مستندات و محیط آزمایش تعاملی</span>
        </div>
        <h1 className="text-2xl font-black text-sec">راهنما و شبیه‌ساز ربات تلگرام</h1>
        <p className="text-xs text-ink-normal/60 mt-1">
          بررسی قوانین پارس، الگوهای مجاز Regex و تست زنده پیام‌های ورودی
        </p>
      </div>

      {/* Interactive Simulator Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Input Editor */}
        <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-extrabold text-sec flex items-center gap-2">
                <Terminal className="w-4 h-4 text-primary" />
                <span>ویرایشگر پیام تستی تلگرام</span>
              </h2>
              <span className="text-[11px] text-ink-normal/50">پردازش آنی</span>
            </div>

            <textarea
              rows={8}
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="پیام /report خود را اینجا بنویسید..."
              className="w-full p-3.5 rounded-xl border border-gray-300 font-mono text-xs focus:border-primary focus:outline-none bg-gray-50/50 leading-relaxed"
            />

            <div className="mt-3 flex flex-wrap gap-2">
              {SAMPLE_TEMPLATES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setTestText(sample.text)}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-gray-100 hover:bg-ecosystem-light hover:text-ecosystem-darker border border-gray-200 transition-colors"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Live Parser Result */}
        <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A]">
          <h2 className="text-sm font-extrabold text-sec mb-3 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-college-normal" />
              <span>نتیجه پردازش پارسر ربات</span>
            </span>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                parseResult.isValid
                  ? "bg-ecosystem-light text-ecosystem-darker border border-primary/30"
                  : "bg-female-light text-female-darker border border-female-normal/30"
              }`}
            >
              {parseResult.isValid ? "✅ ساختار معتبر" : "❌ خطای اعتبارسنجی"}
            </span>
          </h2>

          {parseResult.isValid ? (
            <div className="space-y-3">
              <div className="text-xs text-ink-normal/70 font-semibold">
                تعداد تسک‌های استخراج‌شده: {toPersianDigits(parseResult.items.length)} مورد
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {parseResult.items.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[11px]">
                        {toPersianDigits(item.order)}
                      </span>
                      <span className="font-bold text-sec">{item.description}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.status === "done"
                          ? "bg-ecosystem-light text-ecosystem-darker"
                          : item.status === "incomplete"
                          ? "bg-college-light text-college-darker"
                          : "bg-female-light text-female-darker"
                      }`}
                    >
                      {item.statusFa}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-female-light/60 rounded-xl border border-female-normal/30 text-xs text-female-darker space-y-2">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>پیام خطای بازگشتی به کارمند:</span>
              </div>
              <div className="whitespace-pre-wrap font-medium">{parseResult.error}</div>
            </div>
          )}
        </div>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Flow Guide */}
        <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A]">
          <h3 className="text-base font-extrabold text-sec mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>فلوی احراز هویت و اتصال (`/link`)</span>
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-xs text-ink-normal/80 leading-relaxed">
            <li>مدیر در تب کارکنان، کارمند جدید را ثبت کرده و کد ۶ رقمی تصادفی صادر می‌کند.</li>
            <li>کارمند در تلگرام دستور <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">/link [کد]</code> را ارسال می‌کند.</li>
            <li>سیستم بررسی می‌کند که این اکانت تلگرام به کارمند دیگری وصل نباشد.</li>
            <li>کد اتصال پس از مصرف باطل می‌شود و حساب به حالت متصل تغییر می‌یابد.</li>
          </ol>
        </div>

        {/* Report Flow Guide */}
        <div className="bg-white rounded-2xl p-6 border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A]">
          <h3 className="text-base font-extrabold text-sec mb-3 flex items-center gap-2">
            <Info className="w-5 h-5 text-college-normal" />
            <span>قوانین پارس گزارش (`/report`)</span>
          </h3>
          <ul className="list-disc list-inside space-y-2 text-xs text-ink-normal/80 leading-relaxed">
            <li>خط اول حتماً باید <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">/report</code> باشد.</li>
            <li>هر خط باید فرمت: <code className="bg-gray-100 px-1 py-0.5 rounded font-mono">شماره- شرح تسک - وضعیت</code> باشد.</li>
            <li>وضعیت‌ها فقط شامل: <b>انجام شد</b>، <b>ناقص مانده</b>، <b>لغو شد</b> می‌باشد.</li>
            <li>پردازش اتمیک (Atomic) است؛ اگر یک خط غلط باشد کل گزارش رد می‌شود.</li>
            <li>ارسال مجدد در همان روز، گزارش قبلی را جایگزین و در تاریخچه ثبت می‌کند.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
