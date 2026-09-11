"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UsersRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/employees");
  }, [router]);

  return (
    <div className="flex items-center justify-center p-12 text-xs font-bold text-gray-400">
      در حال انتقال به بخش مدیریت کارکنان...
    </div>
  );
}
