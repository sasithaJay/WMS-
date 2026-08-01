

import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { StockReportRow } from "../../types/reports";

const STATUS_STYLES: Record<StockReportRow["status"], string> = {
  OUT: "bg-red-100 text-red-700",
  LOW: "bg-amber-100 text-amber-700",
  NORMAL: "bg-green-100 text-green-700",
};

export function StockReportTable({ lang, rows }: { lang: Lang; rows: StockReportRow[] }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm">{t(lang, "Current Stock Report", "වත්මන් තොග වාර්තාව")}</h3>
      </div>
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="bg-gray-50 border-b border-gray-100">
              {[t(lang, "Division", "අංශය"), t(lang, "Code", "කේතය"), t(lang, "Item", "භාණ්ඩය"), t(lang, "Category", "වර්ගය"), t(lang, "Qty", "ප්‍රමාණය"), t(lang, "Reorder", "නැවත ඇණවුම්"), t(lang, "Status", "තත්ත්වය")].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((r) => (
              <tr key={r.item_code} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3 text-gray-500 text-xs">{r.division_name}</td>
                <td className="px-5 py-3 font-mono text-xs">{r.item_code}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{r.name_en}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">{r.category}</td>
                <td className="px-5 py-3 font-semibold">{r.quantity_on_hand}</td>
                <td className="px-5 py-3 text-gray-500">{r.reorder_level}</td>
                <td className="px-5 py-3">
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[r.status]}`}>{r.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}