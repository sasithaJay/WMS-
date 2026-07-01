import { t } from "../../constants/translations";
import type { Lang } from "../../types";

const ANNUAL_DATA = [
  { year: "2024", totalReceived: 269, totalIssued: 209, totalRequests: 87, fulfilled: 76 },
  { year: "2023", totalReceived: 312, totalIssued: 278, totalRequests: 102, fulfilled: 95 },
  { year: "2022", totalReceived: 256, totalIssued: 231, totalRequests: 89, fulfilled: 82 },
];

export function AnnualReportTable({ lang }: { lang: Lang }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm">{t(lang, "Annual Summary", "වාර්ෂික සාරාංශය")}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {[t(lang, "Year", "වර්ෂය"), t(lang, "Stock Received", "ලැබුණු"), t(lang, "Stock Issued", "ගිලිහුණු"), t(lang, "Total Requests", "මුළු ඉල්ලීම්"), t(lang, "Fulfilled", "සම්පූර්ණ")].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ANNUAL_DATA.map((r) => (
              <tr key={r.year} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3.5 font-bold text-gray-900">{r.year}</td>
                <td className="px-5 py-3.5 text-green-600 font-semibold">{r.totalReceived}</td>
                <td className="px-5 py-3.5 text-[#4295D9] font-semibold">{r.totalIssued}</td>
                <td className="px-5 py-3.5 text-gray-700 font-semibold">{r.totalRequests}</td>
                <td className="px-5 py-3.5 text-gray-700 font-semibold">{r.fulfilled}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
