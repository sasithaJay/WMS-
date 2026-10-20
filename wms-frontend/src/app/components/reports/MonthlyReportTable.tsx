import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { MonthlyReportRow } from "../../types/reports";

type Props = {
  lang: Lang;
  rows: MonthlyReportRow[];
  month: number;
  year: number;
  divisionLabel: string;
  title?: string;
  periodLabel?: string;
  emptyDescription?: string;
};

function quantity(value: number) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 });
}

export function MonthlyReportTable({ lang, rows, month, year, divisionLabel, title, periodLabel, emptyDescription }: Props) {
  const monthName = new Intl.DateTimeFormat(lang === "si" ? "si-LK" : "en", { month: "long" }).format(
    new Date(year, month - 1, 1),
  );

  return (
    <div className="space-y-6 print:space-y-4">
      <header className="rounded-xl border border-slate-200 bg-white p-5 print:border-0 print:p-0">
        <h2 className="text-lg font-bold text-slate-900">{t(lang, title ?? "Monthly Inventory Transactions", title ?? "Monthly Inventory Transactions")}</h2>
        <p className="mt-1 text-sm text-slate-600">{periodLabel ?? `${monthName} ${year}`} <span className="mx-2 text-slate-300">|</span> {divisionLabel}</p>
      </header>

      {rows.map((division) => (
        <section key={division.division_id} className="overflow-hidden rounded-xl border border-slate-200 bg-white print:break-inside-avoid">
          <h3 className="border-b border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-800">
            {division.division_name}
          </h3>

          <div className="p-5">
            <h4 className="mb-3 text-sm font-bold text-emerald-700">{t(lang, "Received Items", "Received Items")}</h4>
            {division.received_items.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-xs">
                  <thead><tr className="border-b border-slate-200 text-slate-500">
                    {["Item Code", "Item Name", "Supplier", "GRN / Reference", "Received Date", "Quantity", "Unit", "Total Amount with VAT (Rs.)"].map((heading) =>
                      <th key={heading} className="px-3 py-2 font-semibold">{t(lang, heading, heading)}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {division.received_items.map((item, index) => (
                      <tr key={`${item.reference_number}-${item.item_code}-${index}`}>
                        <td className="px-3 py-2 font-mono">{item.item_code}</td><td className="px-3 py-2">{item.item_name}</td>
                        <td className="px-3 py-2">{item.supplier_name}</td><td className="px-3 py-2">{item.reference_number ?? "—"}</td>
                        <td className="px-3 py-2">{item.date ?? "—"}</td><td className="px-3 py-2 text-right">{quantity(item.quantity)}</td>
                        <td className="px-3 py-2">{item.unit}</td>
                        <td className="px-3 py-2 text-right">{item.total_amount_with_vat === null ? "—" : `Rs. ${Number(item.total_amount_with_vat).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-xs text-slate-400">{t(lang, "No items received in this period.", "No items received in this period.")}</p>}
            {division.received_totals.length > 0 && <p className="mt-3 text-right text-xs font-semibold text-emerald-700">
              {t(lang, "Total received", "Total received")}: {division.received_totals.map((total) => `${quantity(total.quantity)} ${total.unit}`).join(" · ")}
            </p>}
          </div>

          <div className="border-t border-slate-100 p-5">
            <h4 className="mb-3 text-sm font-bold text-blue-700">{t(lang, "Issued Items", "Issued Items")}</h4>
            {division.issued_items.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-xs">
                  <thead><tr className="border-b border-slate-200 text-slate-500">
                    {["Item Code", "Item Name", "Quantity", "Unit", "Issue Date", "Request / Issue Reference"].map((heading) =>
                      <th key={heading} className="px-3 py-2 font-semibold">{t(lang, heading, heading)}</th>)}
                  </tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {division.issued_items.map((item, index) => (
                      <tr key={`${item.reference_number}-${item.item_code}-${index}`}>
                        <td className="px-3 py-2 font-mono">{item.item_code}</td><td className="px-3 py-2">{item.item_name}</td>
                        <td className="px-3 py-2 text-right">{quantity(item.quantity)}</td><td className="px-3 py-2">{item.unit}</td>
                        <td className="px-3 py-2">{item.date ?? "—"}</td><td className="px-3 py-2">{item.reference_number ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-xs text-slate-400">{t(lang, "No items issued in this period.", "No items issued in this period.")}</p>}
            {division.issued_totals.length > 0 && <p className="mt-3 text-right text-xs font-semibold text-blue-700">
              {t(lang, "Total issued", "Total issued")}: {division.issued_totals.map((total) => `${quantity(total.quantity)} ${total.unit}`).join(" · ")}
            </p>}
          </div>

          {division.received_items.length > 0 && <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 text-right text-xs print:break-inside-avoid">
            <p>{t(lang, "GRN subtotal for this division", "මෙම අංශයේ GRN උප එකතුව")}: Rs. {Number(division.receipt_subtotal).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="mt-1">{t(lang, "VAT", "VAT")}: Rs. {Number(division.receipt_vat).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            <p className="mt-2 font-bold text-slate-900">{t(lang, "Division total with VAT", "VAT සමඟ අංශයේ මුළු එකතුව")}: Rs. {Number(division.receipt_total_with_vat).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>}
        </section>
      ))}

      {rows.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
        {t(lang, emptyDescription ?? "No inventory transactions match the selected month, year, and division.", emptyDescription ?? "No inventory transactions match the selected month, year, and division.")}
      </div>}
    </div>
  );
}
