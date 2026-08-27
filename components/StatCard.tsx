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
      border: "border-ecosystem-normal/30",
      iconBg: "bg-ecosystem-light text-primary",
      accent: "text-primary",
    },
    male: {
      shadow: "shadow-[2.75px_2.75px_0_#202A5A]",
      border: "border-male-normal/30",
      iconBg: "bg-male-light text-sec",
      accent: "text-sec",
    },
    female: {
      shadow: "shadow-[2.75px_2.75px_0_#E0195B]",
      border: "border-female-normal/30",
      iconBg: "bg-female-light text-girl",
      accent: "text-girl",
    },
    college: {
      shadow: "shadow-[2.75px_2.75px_0_#F8A41D]",
      border: "border-college-normal/30",
      iconBg: "bg-college-light text-third",
      accent: "text-third",
    },
    club: {
      shadow: "shadow-[2.75px_2.75px_0_#652D90]",
      border: "border-club-normal/30",
      iconBg: "bg-club-light text-club-normal",
      accent: "text-club-normal",
    },
  }[theme];

  return (
    <div
      className={cn(
        "bg-white rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-1",
        themeStyles.border,
        themeStyles.shadow
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-ink-normal/60">{title}</span>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", themeStyles.iconBg)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <div className="text-2xl font-black text-ink-darker tracking-tight">{value}</div>
        {trend && (
          <span
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded-md",
              trend.isPositive
                ? "bg-accent-green/10 text-accent-green"
                : "bg-accent-red/10 text-accent-red"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtitle && <div className="text-xs text-ink-normal/50 mt-1">{subtitle}</div>}
    </div>
  );
}
