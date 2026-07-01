import React from "react";

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
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-xl bg-[#EBF4FD] flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        className="w-full py-2.5 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all"
      >
        {buttonLabel}
      </button>
    </div>
  );
}
