import React from "react";

export function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
      <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
}
