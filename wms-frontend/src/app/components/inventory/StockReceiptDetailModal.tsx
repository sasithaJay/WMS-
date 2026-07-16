

import { X } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { StockReceipt, StockReceiptStatus } from "../../types/stockReceipts";

interface StockReceiptDetailModalProps {
  lang: Lang;
  receipt: StockReceipt;
  onClose: () => void;
}

const STATUS_STYLES: Record<StockReceiptStatus, string> = {
  DRAFT: "text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap",
  CONFIRMED: "text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 whitespace-nowrap",
  CANCELLED: "text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 whitespace-nowrap",
};

export function StockReceiptDetailModal({
  lang,
  receipt,
  onClose,
}: StockReceiptDetailModalProps) {
  const totalQuantity = (receipt.items ?? []).reduce(
    (sum, item) => sum + Number(item.quantity_received),
    0,
  );

  const totalValue = (receipt.items ?? []).reduce((sum, item) => {
    if (item.unit_cost === null) return sum;
    return sum + Number(item.unit_cost) * Number(item.quantity_received);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-lg">
        <div className="flex items-start justify-between border-b border-gray-100 p-5">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {receipt.grn_number}
            </h3>
            <span
              className={`mt-1 inline-block rounded-full border px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[receipt.status]}`}
            >
              {receipt.status}
            </span>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-gray-500">
                {t(lang, "Supplier", "සැපයුම්කරු")}
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {receipt.supplier_name}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                {t(lang, "Received Date", "ලැබුණු දිනය")}
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {receipt.received_date.trim() ? new Date(receipt.received_date).toLocaleDateString() : "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                {t(lang, "Invoice Number", "ඉන්වොයිස් අංකය")}
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {receipt.invoice_number ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                {t(lang, "Created By", "සාදන ලද්දේ")}
              </p>
              <p className="mt-1 text-sm font-medium text-gray-900">
                {receipt.created_by}
              </p>
            </div>

            {receipt.confirmed_at && (
              <div>
                <p className="text-xs text-gray-500">
                  {t(lang, "Confirmed At", "තහවුරු කළ දිනය")}
                </p>
                <p className="mt-1 text-sm font-medium text-gray-900">
                  {receipt.confirmed_at}
                </p>
              </div>
            )}
          </div>

          {receipt.notes && (
            <div>
              <p className="text-xs text-gray-500">
                {t(lang, "Notes", "සටහන්")}
              </p>
              <p className="mt-1 text-sm text-gray-700">{receipt.notes}</p>
            </div>
          )}

          <div>
            <h4 className="mb-2 text-sm font-semibold text-gray-900">
              {t(lang, "Items", "භාණ්ඩ")}
            </h4>

            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold text-gray-500">
                  <tr>
                    <th className="px-3 py-2">{t(lang, "Item", "භාණ්ඩය")}</th>
                    <th className="px-3 py-2">{t(lang, "Qty", "ප්‍රමාණය")}</th>
                    <th className="px-3 py-2">{t(lang, "Unit Cost", "ඒකක මිල")}</th>
                    <th className="px-3 py-2">{t(lang, "Remarks", "සටහන්")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(receipt.items ?? []).map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-gray-900">
                        {item.item.item_code} - {item.item.name_en}
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {Number(item.quantity_received)}
                      </td>
                      <td className="px-3 py-2 text-gray-700">
                        {item.unit_cost !== null
                          ? `Rs. ${Number(item.unit_cost).toLocaleString("en-LK", { minimumFractionDigits: 2 })}`
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-gray-500">
                        {item.remarks ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
            <div>
              <p className="text-xs text-gray-500">
                {t(lang, "Total Quantity", "මුළු ප්‍රමාණය")}
              </p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {totalQuantity}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">
                {t(lang, "Total Value", "මුළු වටිනාකම")}
              </p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                Rs. {totalValue.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}