"use client";

import React, { useState } from "react";
import {
  Bot,
  Terminal,
  Sparkles,
  Info,
  ShieldCheck,
} from "lucide-react";
import { parseReportMessage } from "@/lib/telegram/parser";
import { toPersianDigits } from "@/lib/utils";

const SAMPLE_TEMPLATES = [
  {
    title: "نمونه گزارش استاندارد شماره‌دار",
    text: `/report
1- طراحی پروتوتایپ رابط کاربری
2- کدنویسی اندپوینت‌های تلگرام
3- جلسه هماهنگی با تیم`,
  },
  {
    title: "نمونه گزارش خطی ساده",
    text: `/report
پیگیری قراردادهای جدید
بررسی تسک‌های هفتگی
پاسخ‌گویی به تیکت‌های پشتیبانی`,
  },
  {
    title: "نمونه با بولت و علائم",
    text: `/report
• آماده‌سازی بنرهای شبکه‌های اجتماعی
• بارگذاری ویدیوهای آموزشی
• تست عملکرد سرور`,
  },
];

export default function BotGuidePage() {
  const [testText, setTestText] = useState(SAMPLE_TEMPLATES[0].text);
  const parseResult = parseReportMessage(testText);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2 text-sm font-black text-club-normal mb-1.5">
          <Bot className="w-4 h-4" />
          <span>مستندات و محیط آزمایش تعاملی</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-sec tracking-tight">راهنما و شبیه‌ساز ربات تلگرام</h1>
        <p className="text-xs sm:text-sm text-ink-normal/70 mt-1 font-medium">
          بررسی ساختار پیام‌ها و تست زنده پردازش گزارش‌های ورودی
        </p>
      </div>

      {/* Interactive Simulator Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Input Editor */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-black text-sec flex items-center gap-2">
                <Terminal className="w-5 h-5 text-primary" />
                <span>ویرایشگر پیام تستی تلگرام</span>
              </h2>
              <span className="text-xs text-ink-normal/60 font-bold">پردازش آنی</span>
            </div>

            <textarea
              rows={8}
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="پیام /report خود را اینجا بنویسید..."
              className="w-full p-4 rounded-2xl border border-gray-300 font-mono text-xs sm:text-sm focus:border-primary focus:outline-none bg-gray-50/50 leading-relaxed"
            />

            <div className="mt-4 flex flex-wrap gap-2">
              {SAMPLE_TEMPLATES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setTestText(sample.text)}
                  className="px-3 py-1.5 text-xs font-bold rounded-xl bg-gray-100 hover:bg-ecosystem-light hover:text-ecosystem-darker border border-gray-200 transition-colors"
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Live Parser Result */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A]">
          <h2 className="text-base font-black text-sec mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-college-normal" />
              <span>نتیجه پردازش پارسر ربات</span>
            </span>
            <span
              className={`text-xs font-black px-3 py-1 rounded-full ${
                parseResult.isValid
                  ? "bg-ecosystem-light text-ecosystem-darker border border-primary/30"
                  : "bg-female-light text-female-darker border border-female-normal/30"
              }`}
            >
              {parseResult.isValid ? "✅ پیام معتبر" : "❌ خطای متن"}
            </span>
          </h2>

          {parseResult.isValid ? (
            <div className="space-y-4">
              <div className="text-xs sm:text-sm text-ink-normal/70 font-bold">
                تعداد موارد استخراج‌شده: {toPersianDigits(parseResult.items.length)} بند
              </div>
              <div className="space-y-2.5 max-h-60 overflow-y-auto">
                {parseResult.items.map((item, i) => (
                  <div
                    key={i}
                    className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between text-xs sm:text-sm"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-primary/20 text-primary font-black flex items-center justify-center text-xs">
                        {toPersianDigits(item.order)}
                      </span>
                      <span className="font-bold text-sec">{item.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-5 bg-female-light/60 rounded-2xl border border-female-normal/30 text-xs sm:text-sm text-female-darker space-y-2">
              <div className="whitespace-pre-wrap font-medium leading-relaxed">{parseResult.error}</div>
            </div>
          )}
        </div>
      </div>

      {/* Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Flow Guide */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A]">
          <h3 className="text-base sm:text-lg font-black text-sec mb-3.5 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>فلوی احراز هویت و اتصال (`/link`)</span>
          </h3>
          <ol className="list-decimal list-inside space-y-2.5 text-xs sm:text-sm text-ink-normal/80 leading-relaxed font-medium">
            <li>مدیر در تب کارکنان، کارمند جدید را ثبت کرده و کد ۶ رقمی تصادفی صادر می‌کند.</li>
            <li>کارمند در تلگرام دستور <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">/link [کد]</code> را ارسال می‌کند.</li>
            <li>سیستم حساب تلگرام او را متصل کرده و پیام خوش‌آمدگویی ارسال می‌کند.</li>
          </ol>
        </div>

        {/* Report Flow Guide */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-[#EAEAEA] shadow-[3px_3px_0_#202A5A]">
          <h3 className="text-base sm:text-lg font-black text-sec mb-3.5 flex items-center gap-2">
            <Info className="w-5 h-5 text-college-normal" />
            <span>نحوه ارسال گزارش کار (`/report`)</span>
          </h3>
          <ul className="list-disc list-inside space-y-2.5 text-xs sm:text-sm text-ink-normal/80 leading-relaxed font-medium">
            <li>پیام با دستور <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">/report</code> شروع می‌شود.</li>
            <li>کارمند شرح کارهای روزانه را در خطوط بعدی به صورت شماره‌دار یا ساده می‌نویسد.</li>
            <li>هیچ نیازی به نوشتن وضعیت‌های پیچیده نیست.</li>
            <li>ارسال مجدد در همان روز، گزارش قبلی را به‌روزرسانی و در تاریخچه نگهداری می‌کند.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
