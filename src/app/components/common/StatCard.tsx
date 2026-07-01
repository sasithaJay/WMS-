import React from "react";

export function StatCard({
  label,
  value,
  sub,
  color = "blue",
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: "blue" | "green" | "amber" | "red" | "purple";
  icon: React.ReactNode;
}) {
  const colors = {
    blue: "bg-[#EBF4FD] text-[#4295D9]",
    green: "bg-green-50 text-green-600",
    amber: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
    purple: "bg-purple-50 text-purple-600",
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-start gap-4 hover:shadow-sm transition-shadow">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900 leading-tight">{value}</div>
        <div className="text-sm font-medium text-gray-600 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
