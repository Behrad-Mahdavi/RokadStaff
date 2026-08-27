import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "رُکاد‌استاف | سامانه مدیریت گزارش کار روزانه",
  description: "سامانه ثبت و پردازش خودکار گزارش کار روزانه کارکنان رُکاد از طریق ربات تلگرام",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="antialiased font-sans bg-[#F8F9FA] text-ink-normal">
        {children}
      </body>
    </html>
  );
}
