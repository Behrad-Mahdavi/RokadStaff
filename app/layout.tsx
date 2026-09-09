import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
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
      <body className="antialiased font-sans bg-[#F8F9FA] dark:bg-[#0B0F17] text-ink-normal dark:text-gray-100 transition-colors duration-200">
        {children}
      </body>
    </html>
  );
}
