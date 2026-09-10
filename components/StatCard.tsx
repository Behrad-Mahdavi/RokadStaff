import React from "react";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  theme?: "ecosystem" | "male" | "female" | "college" | "club";
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  theme = "ecosystem",
  trend,
}: StatCardProps) {
  const themeStyles = {
    ecosystem: {
      shadow: "shadow-[2.75px_2.75px_0_#59BBAF]",
      border: "border-ecosystem-normal/30 dark:border-primary/40",
      iconBg: "bg-ecosystem-light dark:bg-ecosystem-darker/70 text-primary dark:text-ecosystem-light",
      accent: "text-primary",
    },
    male: {
      shadow: "shadow-[2.75px_2.75px_0_#202A5A] dark:shadow-[2.75px_2.75px_0_#3F50A0]",
      border: "border-male-normal/30 dark:border-blue-500/30",
      iconBg: "bg-male-light dark:bg-[#1C2846] text-sec dark:text-blue-200",
      accent: "text-sec dark:text-blue-300",
    },
    female: {
      shadow: "shadow-[2.75px_2.75px_0_#E0195B] dark:shadow-[2.75px_2.75px_0_#E0195B]",
      border: "border-female-normal/30 dark:border-pink-500/30",
      iconBg: "bg-female-light dark:bg-female-darker/60 text-girl dark:text-pink-200",
      accent: "text-girl dark:text-pink-300",
    },
    college: {
      shadow: "shadow-[2.75px_2.75px_0_#F8A41D] dark:shadow-[2.75px_2.75px_0_#F8A41D]",
      border: "border-college-normal/30 dark:border-amber-500/30",
      iconBg: "bg-college-light dark:bg-college-darker/60 text-third dark:text-amber-200",
      accent: "text-third dark:text-amber-300",
    },
    club: {
      shadow: "shadow-[2.75px_2.75px_0_#652D90] dark:shadow-[2.75px_2.75px_0_#8A38F5]",
      border: "border-club-normal/30 dark:border-purple-500/30",
      iconBg: "bg-club-light dark:bg-club-darker/60 text-club-normal dark:text-purple-200",
      accent: "text-club-normal dark:text-purple-300",
    },
  }[theme];

  return (
    <div
      className={cn(
        "bg-white dark:bg-[#151C28] rounded-2xl p-4 sm:p-5 border transition-all duration-200 hover:-translate-y-1",
        themeStyles.border,
        themeStyles.shadow
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-ink-normal/70 dark:text-gray-400 leading-snug">{title}</span>
        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", themeStyles.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2 flex-wrap">
        <div className="text-2xl sm:text-3xl font-black text-ink-darker dark:text-white tracking-tight">{value}</div>
        {trend && (
          <span
            className={cn(
              "text-xs font-black px-2.5 py-1 rounded-lg",
              trend.isPositive
                ? "bg-accent-green/15 text-accent-green"
                : "bg-accent-red/15 text-accent-red"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <div className="text-xs sm:text-sm text-ink-normal/60 dark:text-gray-400 mt-2 font-medium leading-relaxed">{subtitle}</div>}
    </div>
  );
}
