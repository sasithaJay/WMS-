

import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { ReceiptReportRow } from "../../types/reports";

export function ReceiptReportTable({ lang, rows }: { lang: Lang; rows: ReceiptReportRow[] }) {
  return (
    <div className="space-y-4 max-h-[420px] overflow-y-auto">
      {rows.map((receipt) => (
        <div key={receipt.grn_number} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <span className="font-mono text-xs font-bold text-gray-700">{receipt.grn_number}</span>
              <span className="text-xs text-gray-400 ml-2">{receipt.supplier_name}</span>
            </div>
            <span className="text-xs text-gray-400">{receipt.confirmed_at}</span>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-50">
              {receipt.items.map((it, i) => (
                <tr key={i}>
                  <td className="px-5 py-2 font-mono text-xs text-gray-500">{it.item_code}</td>
                  <td className="px-5 py-2 text-gray-900">{it.name_en}</td>
                  <td className="px-5 py-2 text-right font-semibold">{it.quantity_received}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      {rows.length === 0 && <p className="text-sm text-gray-400 text-center py-8">{t(lang, "No receipts in this period.", "මෙම කාලය තුළ රිසිට් නොමැත.")}</p>}
    </div>
  );
}