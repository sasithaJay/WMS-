

import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { MonthlyReportRow } from "../../types/reports";

export function MonthlyReportTable({ lang, rows }: { lang: Lang; rows: MonthlyReportRow[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm">{t(lang, "Monthly Summary", "මාසික සාරාංශය")}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {[t(lang, "Month", "මාසය"), t(lang, "Received", "ලැබුණු"), t(lang, "Issued", "ගිලිහුණු"), t(lang, "Pending", "අපේක්ෂිත"), t(lang, "Rejected", "ප්‍රතික්ෂේප")].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r) => (
              <tr key={r.month} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-gray-900">{r.month_name}</td>
                <td className="px-5 py-3.5 text-green-600 font-semibold">{r.received}</td>
                <td className="px-5 py-3.5 text-[#4295D9] font-semibold">{r.issued}</td>
                <td className="px-5 py-3.5 text-amber-600 font-semibold">{r.pending}</td>
                <td className="px-5 py-3.5 text-red-600 font-semibold">{r.rejected}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}