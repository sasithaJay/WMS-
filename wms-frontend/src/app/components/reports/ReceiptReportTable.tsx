import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { ReceiptReportRow } from "../../types/reports";

export function ReceiptReportTable({ lang, rows }: { lang: Lang; rows: ReceiptReportRow[] }) {
  return (
    <div className="max-h-[420px] overflow-auto rounded-xl border border-gray-100 bg-white">
      <table className="w-full min-w-[1050px] table-fixed text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-b border-gray-100 bg-gray-50">
            {[
              ["GRN", "GRN"],
              ["Supplier", "Supplier"],
              ["Date", "Date"],
              ["Division", "à¶…à¶‚à·à¶º"],
              ["Code", "Code"],
              ["Item", "Item"],
              ["Quantity", "Quantity"],
            ].map(([header, fallback]) => (
              <th key={header} className="px-4 py-2 text-left text-xs font-semibold text-gray-500">
                {t(lang, header, fallback)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.flatMap((receipt) =>
            receipt.items.map((item, index) => (
              <tr key={`${receipt.grn_number}-${index}`}>
                <td className="px-4 py-2 font-mono text-xs font-bold text-gray-700">{receipt.grn_number}</td>
                <td className="px-4 py-2 text-xs text-gray-600">{receipt.supplier_name}</td>
                <td className="px-4 py-2 text-xs text-gray-600">{receipt.received_date?.split("T")[0]}</td>
                <td className="px-4 py-2 text-xs text-gray-500">{receipt.division_name}</td>
                <td className="px-4 py-2 font-mono text-xs text-gray-500">{item.item_code}</td>
                <td className="px-4 py-2 text-gray-900">{item.name_en}</td>
                <td className="px-4 py-2 text-right font-semibold">{item.quantity_received}</td>
              </tr>
            )),
          )}
        </tbody>
      </table>
      {rows.length === 0 && <p className="py-8 text-center text-sm text-gray-400">{t(lang, "No receipts in this period.", "à¶¸à·™à¶¸ à¶šà·à¶½à¶º à¶­à·”à·… à¶»à·’à·ƒà·’à¶§à·Š à¶±à·œà¶¸à·à¶­.")}</p>}
    </div>
  );
}
