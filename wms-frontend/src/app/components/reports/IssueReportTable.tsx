

import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { IssueReportRow } from "../../types/reports";

export function IssueReportTable({ lang, rows }: { lang: Lang; rows: IssueReportRow[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm">{t(lang, "Issue Report", "ගිලිහීම් වාර්තාව")}</h3>
      </div>
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="bg-gray-50 border-b border-gray-100">
              {[t(lang, "Date", "දිනය"), t(lang, "Code", "කේතය"), t(lang, "Item", "භාණ්ඩය"), t(lang, "Qty", "ප්‍රමාණය"), t(lang, "Reference", "යොමුව"), t(lang, "Issued By", "නිකුත් කළේ")].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r, i) => (
              <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">{r.date}</td>
                <td className="px-5 py-3 font-mono text-xs">{r.item_code}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{r.item_name}</td>
                <td className="px-5 py-3 font-semibold">{r.quantity}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">{r.reference_number}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">{r.performed_by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}