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
    <div className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md hover:border-blue-200/80 dark:hover:border-slate-700">
      {/* Card Header & Content */}
      <div className="flex items-start gap-4 mb-5">
        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20 flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      {/* Action Button */}
      <button
        type="button"
        onClick={onClick}
        className="w-full h-10 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
      >
        <span>{buttonLabel}</span>
        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
      </button>
    </div>
  );
}