import React from "react";

export function SectionCard({
  title,
  action,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100">
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          {title && <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}
