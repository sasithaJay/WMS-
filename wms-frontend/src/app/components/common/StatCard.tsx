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
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    red: "bg-rose-50 text-rose-700 border-rose-100",
    purple: "bg-indigo-50 text-indigo-700 border-indigo-100",
  };

  const containerBgStyles = {
    bgBlue: "bg-white md:bg-blue-100/70 hover:border-blue-200/80",
    bgGreen: "bg-white md:bg-emerald-100/70 hover:border-emerald-200/80",
    bgAmber: "bg-white md:bg-amber-100/70 hover:border-amber-200/80",
    bgRed: "bg-white md:bg-rose-100/70 hover:border-rose-200/80",
    bgPurple: "bg-white md:bg-indigo-100/70 hover:border-indigo-200/80",
  };

  return (
    <div
      className={`relative flex items-start gap-4 rounded-2xl border border-slate-200/80 p-5 shadow-[0_2px_8px_rgba(15,23,42,0.035)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_5px_16px_rgba(15,23,42,0.07)] ${containerBgStyles[bgColor]}`}
    >
      {/* Icon Badge */}
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${badgeStyles[color]}`}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
          {value}
        </div>

        <p className="mt-1.5 truncate text-xs font-medium text-slate-600">
          {label}
        </p>

        {sub && (
          <p className="mt-1 truncate text-[11px] font-medium text-slate-500">
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}
