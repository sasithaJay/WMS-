

import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { OfficerReportGroup } from "../../types/reports";

export function OfficerRequestReportTable({ lang, groups }: { lang: Lang; groups: OfficerReportGroup[] }) {
  return (
    <div className="space-y-4 max-h-[420px] overflow-y-auto">
      {groups.map((group) => (
        <div key={group.officer_name} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <span className="font-semibold text-sm text-gray-900">{group.officer_name}</span>
            {group.division_name && <span className="text-xs text-gray-400 ml-2">{group.division_name}</span>}
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {group.requests.map((r) => (
                <tr key={r.request_number}>
                  <td className="px-5 py-2 font-mono text-xs text-gray-500">{r.request_number}</td>
                  <td className="px-5 py-2 text-gray-500 text-xs">{r.request_context}</td>
                  <td className="px-5 py-2 text-gray-500 text-xs">{r.status}</td>
                  <td className="px-5 py-2 text-gray-500 text-xs">{r.submitted_at}</td>
                  <td className="px-5 py-2 text-right text-xs">{r.item_count} {t(lang, "items", "අයිතම")}</td>
                  <td className="px-5 py-2 text-gray-500 text-xs">
                    <ul className="m-0 p-0 list-none space-y-1 ">
                      {r.items.map((item) => (
                        <li key={item.item_code} className="text-xs">
                          {item.item_code} - {item.name_en} ({item.quantity_requested})
                        </li>
                      ))}
                    </ul>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {groups.length === 0 && <p className="text-sm text-gray-400 text-center py-8">{t(lang, "No requests in this period.", "මෙම කාලය තුළ ඉල්ලීම් නොමැත.")}</p>}
    </div>
  );
}