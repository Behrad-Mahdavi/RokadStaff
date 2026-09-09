import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const iransans = localFont({
  src: [
    {
      path: "../fonts/IRANSansXFaNum-LightD4.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../fonts/IRANSansXFaNum-RegularD4.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../fonts/IRANSansXFaNum-MediumD4.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../fonts/IRANSansXFaNum-DemiBoldD4.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../fonts/IRANSansXFaNum-BoldD4.ttf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../fonts/IRANSansXFaNum-ExtraBoldD4.ttf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../fonts/IRANSansXFaNum-BlackD4.ttf",
      weight: "900",
      style: "normal",
    },
  ],
  variable: "--font-iransans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "روتلو | مدیریت پروژه‌ها و کارها",
  description: "سامانه مدیریت پروژه‌ها و کارها - روتلو عوامل",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={iransans.variable} suppressHydrationWarning>
      <head>
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body className={`${iransans.className} font-sans antialiased bg-[#F8F9FA] dark:bg-[#0B0F17] text-ink-normal dark:text-gray-100 transition-colors duration-200`}>
        {children}
      </body>
    </html>
  );
}
