import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { getPendingApprovalItemSummary } from "../../../services/stockRequestService";
import type { ApprovalItemSummary as ApprovalItemSummaryData } from "../../types/stockRequests";
import type { Lang } from "../../types";
import { t } from "../../constants/translations";

export function ApprovalItemSummary({ lang }: { lang: Lang }) {
  const [summary, setSummary] = useState<ApprovalItemSummaryData | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setSummary(await getPendingApprovalItemSummary(selectedStoreId));
    } catch (err) {
      console.error(err);
      setError(t(lang, "Unable to load the item-wise summary.", "භාණ්ඩ අනුව සාරාංශය පූරණය කළ නොහැක."));
    } finally {
      setLoading(false);
    }
  }, [lang, selectedStoreId]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void loadSummary();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [loadSummary]);

  const selectedStore = summary?.store;
  const showStoreSelector = (summary?.stores.length ?? 0) > 1;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{t(lang, "Item-wise Summary", "භාණ්ඩ අනුව සාරාංශය")}</h2>
          <p className="mt-1 text-xs text-slate-500">
            {t(lang, "Requested quantities for items still awaiting approval.", "අනුමැතිය බලාපොරොත්තුවෙන් ඇති භාණ්ඩ ඉල්ලූ ප්‍රමාණ.")}
          </p>
        </div>
        {showStoreSelector && (
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>{t(lang, "Store", "ගබඩාව")}</span>
            <select
              value={selectedStoreId ?? selectedStore?.id ?? ""}
              onChange={(event) => setSelectedStoreId(Number(event.target.value))}
              className="h-9 min-w-52 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            >
              {summary?.stores.map((store) => (
                <option key={store.id} value={store.id}>{store.name_en}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />{error}
        </div>
      )}

      {loading && !summary ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-10 text-center text-slate-400">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" />
        </div>
      ) : summary?.officers.length ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-600">
                  <th className="sticky left-0 z-10 min-w-56 bg-slate-50 px-4 py-3">{t(lang, "Officer Name", "නිලධාරියාගේ නම")}</th>
                  {summary.items.map((item) => (
                    <th key={item.id} className="min-w-32 px-4 py-3 text-center">
                      <span className="block font-mono text-[10px] text-slate-400">{item.item_code}</span>
                      <span className="mt-0.5 block text-slate-700">{item.name_en}</span>
                      <span className={`mt-1 inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-[10px] font-semibold ${item.available_quantity <= 0 ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
                        {item.available_quantity <= 0
                          ? t(lang, "Out of stock (0)", "තොග නොමැත (0)")
                          : `${item.available_quantity} ${t(lang, "in stock", "තොගයේ ඇත")}`}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.officers.map((officer) => (
                  <tr key={officer.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70">
                    <th scope="row" className="sticky left-0 bg-white px-4 py-3 text-left font-semibold text-slate-800">
                      <span className="block">{officer.name}</span>
                      {officer.role_label && <span className="mt-0.5 block text-[10px] font-medium text-slate-500">{officer.role_label}</span>}
                    </th>
                    {summary.items.map((item) => {
                      const quantity = officer.quantities[item.id] ?? 0;
                      return (
                        <td key={item.id} className={`px-4 py-3 text-center font-mono tabular-nums ${quantity !== 0 ? "text-[13px] font-bold text-slate-900" : "text-xs font-medium text-slate-700"}`}>
                          {quantity === 0 ? "-" : quantity}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50 font-bold text-slate-900">
                  <th className="sticky left-0 bg-slate-50 px-4 py-3 text-left">{t(lang, "Total", "එකතුව")}</th>
                  {summary.items.map((item) => {
                    const total = summary.totals[item.id] ?? 0;
                    return (
                      <td key={item.id} className={`px-4 py-3 text-center font-mono tabular-nums ${total !== 0 ? "text-[14px] font-bold text-slate-900" : "text-xs font-bold text-slate-900"}`}>
                        {total === 0 ? "-" : total}
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="text-sm font-semibold text-slate-700">{t(lang, "No pending approval requests", "අනුමැතිය බලාපොරොත්තුවෙන් ඉල්ලීම් නොමැත")}</p>
          <p className="mt-1 text-xs text-slate-500">{selectedStore?.name_en ?? t(lang, "No store available", "ගබඩාවක් නොමැත")}</p>
        </div>
      )}
    </section>
  );
}
