"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MissingReportsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/reports?tab=missing");
  }, [router]);

  return (
    <div className="p-8 text-center text-sm font-bold text-ink-normal/60">
      در حال انتقال به صفحه یکپارچه گزارش‌ها و غایبان...
    </div>
  );
}
