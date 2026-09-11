import React from "react";

export function StatCard({
  label,
  value,
  sub,
  color = "blue",
  bgColor = "bgBlue",
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "green" | "amber" | "red" | "purple";
  bgColor?: "bgBlue" | "bgGreen" | "bgAmber" | "bgRed" | "bgPurple";
  icon: React.ReactNode;
}) {
  const badgeStyles = {
    blue: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    amber: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    red: "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
    purple: "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/20",
  };

  const containerBgStyles = {
    bgBlue: "hover:border-blue-200/80",
    bgGreen: "hover:border-emerald-200/80",
    bgAmber: "hover:border-amber-200/80",
    bgRed: "hover:border-rose-200/80",
    bgPurple: "hover:border-indigo-200/80",
  };

  return (
    <div
      className={`relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex items-start gap-4 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 ${containerBgStyles[bgColor]}`}
    >
      {/* Icon Badge */}
      <div
        className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 shadow-xs ${badgeStyles[color]}`}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
          {value}
        </div>

        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1.5 truncate">
          {label}
        </p>

        {sub && (
          <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-1 truncate">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}