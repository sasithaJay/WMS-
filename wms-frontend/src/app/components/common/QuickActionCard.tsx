import React from "react";
import { ArrowRight } from "lucide-react";

export function QuickActionCard({
  icon,
  title,
  description,
  buttonLabel,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.035)] transition-all duration-200 hover:border-blue-200/80 hover:shadow-[0_5px_16px_rgba(15,23,42,0.07)]">
      {/* Card Header & Content */}
      <div className="flex items-start gap-4 mb-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700 transition-transform duration-200 group-hover:scale-105">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold tracking-tight text-slate-900">
            {title}
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-600">
            {description}
          </p>
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={onClick}
        className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm shadow-blue-600/10 transition-all duration-200 hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:bg-blue-800"
      >
        <span>{buttonLabel}</span>
        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
      </button>
    </div>
  );
}
