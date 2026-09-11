import { X, Receipt, Building2, Calendar, FileText, User, CheckCircle2 } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { StockReceipt, StockReceiptStatus } from "../../types/stockReceipts";

interface StockReceiptDetailModalProps {
  lang: Lang;
  receipt: StockReceipt;
  onClose: () => void;
}

const STATUS_STYLES: Record<StockReceiptStatus, string> = {
  DRAFT: "bg-amber-50 text-amber-700 border-amber-200/80",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
};

export function StockReceiptDetailModal({
  lang,
  receipt,
  onClose,
}: StockReceiptDetailModalProps) {
  const totalQuantity = (receipt.items ?? []).reduce(
    (sum, item) => sum + Number(item.quantity_received),
    0
  );

  const totalValue = (receipt.items ?? []).reduce((sum, item) => {
    if (item.unit_cost === null) return sum;
    return sum + Number(item.unit_cost) * Number(item.quantity_received);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Blurred Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 my-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm tracking-tight flex items-center gap-2">
                <span>{receipt.grn_number}</span>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                    STATUS_STYLES[receipt.status]
                  }`}
                >
                  {receipt.status}
                </span>
              </h3>
              <p className="text-[11px] font-medium text-slate-400">
                {t(lang, "Goods Received Note Details", "තොග රිසිට්පත් විස්තර")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-500 hover:text-slate-900 transition-all flex items-center justify-center cursor-pointer shrink-0"
            title={t(lang, "Close", "වසා දමන්න")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50/60 p-4 rounded-2xl border border-slate-100/80">
            <div className="flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t(lang, "Supplier", "සැපයුම්කරු")}
                </p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {receipt.supplier_name}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t(lang, "Received Date", "ලැබුණු දිනය")}
                </p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {receipt.received_date.trim()
                    ? new Date(receipt.received_date).toLocaleDateString()
                    : "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <FileText className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t(lang, "Invoice Number", "ඉන්වොයිස් අංකය")}
                </p>
                <p className="text-xs font-bold text-slate-800 font-mono mt-0.5">
                  {receipt.invoice_number ?? "—"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {t(lang, "Created By", "සාදන ලද්දේ")}
                </p>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {receipt.created_by}
                </p>
              </div>
            </div>

            {receipt.confirmed_at && (
              <div className="flex items-start gap-2.5 sm:col-span-2 pt-2 border-t border-slate-200/40">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {t(lang, "Confirmed At", "තහවුරු කළ දිනය")}
                  </p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">
                    {receipt.confirmed_at}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Notes Banner */}
          {receipt.notes && (
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {t(lang, "Notes", "සටහන්")}
              </p>
              <p className="text-xs font-medium text-slate-700 leading-relaxed">
                {receipt.notes}
              </p>
            </div>
          )}

          {/* Items Section */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 tracking-tight">
              {t(lang, "Items", "භාණ්ඩ")}
            </h4>

            {/* DESKTOP TABLE VIEW (md+) */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200/80 shadow-2xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-2.5">{t(lang, "Item", "භාණ්ඩය")}</th>
                    <th className="px-4 py-2.5">{t(lang, "Qty", "ප්‍රමාණය")}</th>
                    <th className="px-4 py-2.5">{t(lang, "Unit Cost", "ඒකක මිල")}</th>
                    <th className="px-4 py-2.5">{t(lang, "Remarks", "සටහන්")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {(receipt.items ?? []).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">
                        <span className="font-mono text-slate-500 font-semibold mr-1.5">
                          {item.item.item_code}
                        </span>
                        — {item.item.name_en}
                      </td>
                      <td className="px-4 py-3 font-bold font-mono text-slate-900">
                        {Number(item.quantity_received)}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                        {item.unit_cost !== null
                          ? `Rs. ${Number(item.unit_cost).toLocaleString("en-LK", {
                              minimumFractionDigits: 2,
                            })}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {item.remarks ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CARD VIEW (<md) */}
            <div className="block md:hidden divide-y divide-slate-100 rounded-2xl border border-slate-200/80 overflow-hidden">
              {(receipt.items ?? []).map((item) => (
                <div key={item.id} className="p-3.5 space-y-2 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {item.item.item_code}
                      </span>
                      <h5 className="text-xs font-bold text-slate-900 mt-1">
                        {item.item.name_en}
                      </h5>
                    </div>
                    <span className="text-xs font-extrabold font-mono text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                      Qty: {Number(item.quantity_received)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50">
                    <span className="text-slate-400 font-medium">
                      {t(lang, "Unit Cost", "ඒකක මිල")}:
                    </span>
                    <span className="font-bold font-mono text-slate-800">
                      {item.unit_cost !== null
                        ? `Rs. ${Number(item.unit_cost).toLocaleString("en-LK", {
                            minimumFractionDigits: 2,
                          })}`
                        : "—"}
                    </span>
                  </div>

                  {item.remarks && (
                    <p className="text-[11px] font-medium text-slate-400 bg-slate-50 p-2 rounded-lg">
                      {item.remarks}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Financial Calculation Totals */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t(lang, "Total Quantity", "මුළු ප්‍රමාණය")}
              </p>
              <p className="mt-1 text-base font-extrabold font-mono text-slate-900">
                {totalQuantity}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t(lang, "Subtotal", "උප එකතුව")}
              </p>
              <p className="mt-1 text-base font-extrabold font-mono text-slate-900">
                Rs. {totalValue.toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t(lang, "VAT", "VAT")} ({Number(receipt.vat_percentage)}%)
              </p>
              <p className="mt-1 text-base font-extrabold font-mono text-slate-900">
                Rs. {Number(receipt.vat_amount).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                {t(lang, "Total (incl. VAT)", "මුළු එකතුව (VAT සමඟ)")}
              </p>
              <p className="mt-1 text-base font-extrabold font-mono text-blue-600">
                Rs. {Number(receipt.total_with_vat).toLocaleString("en-LK", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}