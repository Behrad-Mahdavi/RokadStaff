"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Users, ArrowLeft, Search, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { toPersianDigits } from "@/lib/utils";

export default function EmployeeReportsHubPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");

  useEffect(() => {
    fetch("/api/employees")
      .then((res) => res.json())
      .then((data) => {
        if (data.employees) {
          setEmployees(data.employees.filter((e: any) => e.isActive));
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const departments = Array.from(
    new Set(employees.map((e) => e.department).filter(Boolean))
  );

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.position && emp.position.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDept = selectedDept === "all" || emp.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto font-vazirmatn space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-sec dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-primary" />
            <span>گزارش جامع و کارنامه همکاران</span>
          </h1>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white dark:bg-[#151C28] rounded-2xl border border-[#EAEAEA] dark:border-gray-800 shadow-[3px_3px_0_#202A5A] dark:shadow-[3px_3px_0_#59BBAF] flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="جستجوی نام یا سمت شغلی همکار..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs sm:text-sm font-medium pr-10 pl-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121824] text-sec dark:text-white focus:border-primary focus:outline-none"
          />
        </div>

        <div className="w-full sm:w-60">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="w-full text-xs sm:text-sm font-bold p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#121824] focus:border-primary focus:outline-none text-sec dark:text-white"
          >
            <option value="all">همه دپارتمان‌ها</option>
            {departments.map((d) => (
              <option key={d} value={d} className="dark:bg-[#121824]">
                دپارتمان {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Employees Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400 font-bold">
          در حال بارگذاری لیست کارکنان...
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="p-12 bg-white dark:bg-[#151C28] rounded-2xl border border-gray-200 dark:border-gray-800 text-center text-xs text-gray-400">
          همکاری با این مشخصات یافت نشد.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEmployees.map((emp) => (
            <div
              key={emp.id}
              className="p-5 bg-white dark:bg-[#151C28] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-[2.5px_2.5px_0_#202A5A] dark:shadow-[2.5px_2.5px_0_#59BBAF] hover:border-primary/50 transition-all flex flex-col justify-between"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-ecosystem-dark text-white flex items-center justify-center font-black text-lg shadow-sm shrink-0">
                  {emp.fullName.slice(0, 1)}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black text-sec dark:text-white truncate">{emp.fullName}</h3>
                  <div className="text-xs text-ink-normal/60 dark:text-gray-400 font-medium mt-0.5">
                    {emp.position || "همکار"} • دپارتمان {emp.department || "عمومی"}
                  </div>
                  <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-ecosystem-light dark:bg-ecosystem-darker/60 text-ecosystem-darker dark:text-ecosystem-light border border-primary/20">
                    {emp.role === "admin" ? "راهبر ارشد" : emp.role === "supervisor" ? "راهبر" : "عضو تیم"}
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xs text-ink-normal/40 dark:text-gray-500 font-medium">مشاهده آمار و کارنامه</span>
                <Link
                  href={`/reports/employee/${emp.id}`}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-sec dark:bg-primary dark:text-[#121824] text-white text-xs font-black hover:bg-sec/90 dark:hover:bg-primary/90 transition shadow-sm"
                >
                  <span>کارنامه جامع</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
