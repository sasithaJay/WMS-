import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { IssueReportRow } from "../../types/reports";

export function IssueReportTable({ lang, rows }: { lang: Lang; rows: IssueReportRow[] }) {
  const headers = [
    t(lang, "Division", "අංශය"),
    t(lang, "Date", "දිනය"),
    t(lang, "Code", "කේතය"),
    t(lang, "Item", "භාණ්ඩය"),
    t(lang, "Qty", "ප්‍රමාණය"),
    t(lang, "Reference", "යොමුව"),
    t(lang, "Requester", "ඉල්ලුම්කරු"),
    t(lang, "Issued By", "නිකුත් කළේ"),
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm">{t(lang, "Issue Report", "නිකුත් කිරීමේ වාර්තාව")}</h3>
      </div>
      <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-white">
            <tr className="bg-gray-50 border-b border-gray-100">
              {headers.map((header) => (
                <th key={header} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-3 text-gray-500 text-xs">{row.division_name}</td>
                <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">{row.date}</td>
                <td className="px-5 py-3 font-mono text-xs">{row.item_code}</td>
                <td className="px-5 py-3 font-medium text-gray-900">{row.item_name}</td>
                <td className="px-5 py-3 font-semibold">{row.quantity}</td>
                <td className="px-5 py-3 text-gray-500 text-xs">{row.reference_number}</td>
                <td className="px-5 py-3 text-gray-700 text-xs">
                  <div className="font-medium">{row.requester_name}</div>
                  <div className="text-gray-400">{row.requester_position}</div>
                </td>
                <td className="px-5 py-3 text-gray-500 text-xs">{row.performed_by}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
