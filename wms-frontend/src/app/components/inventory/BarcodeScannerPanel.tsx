import { useState } from "react";
import { Search, ScanBarcode, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { INVENTORY_ITEMS } from "../../constants/mockData";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";

export function BarcodeScannerPanel({ lang }: { lang: Lang }) {
  const [code, setCode] = useState("");

  const found = INVENTORY_ITEMS.find(
    (it) =>
      it.code.toLowerCase() === code.toLowerCase().trim() ||
      it.name.toLowerCase().includes(code.toLowerCase().trim())
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4 max-w-md w-full">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
          <ScanBarcode className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">
            {t(lang, "Barcode / Item Lookup", "බාකෝඩ / භාණ්ඩ සෙවීම")}
          </h3>
          <p className="text-[11px] font-medium text-slate-400">
            {t(lang, "Search inventory or scan item barcodes", "තොග සෙවීම හෝ බාකෝඩය ස්කෑන් කරන්න")}
          </p>
        </div>
      </div>

      {/* Input Field */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t(
            lang,
            "Enter item code or barcode…",
            "භාණ්ඩ කේතය හෝ බාකෝඩය ඇතුලත් කරන්න…"
          )}
          className="w-full h-10 pl-10 pr-9 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
        />
        {code && (
          <button
            type="button"
            onClick={() => setCode("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Item Found Result Card */}
      {code.trim() && found && (
        <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
              {t(lang, "Item Found", "භාණ්ඩය හමුවිය")}
            </span>
            <span className="font-mono text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200/60">
              {found.code}
            </span>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 text-sm">{found.name}</h4>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5">
              {found.category} · {found.division}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-blue-100/80">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t(lang, "Current Qty", "වත්මන් ප්‍රමාණය")}
              </span>
              <span
                className={`font-mono text-xs font-extrabold block mt-0.5 ${
                  found.qty <= found.reorder ? "text-rose-600" : "text-slate-900"
                }`}
              >
                {found.qty} {found.unit}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t(lang, "Reorder Level", "නැවත ඇණවුම්")}
              </span>
              <span className="font-mono text-xs font-bold text-slate-800 block mt-0.5">
                {found.reorder} {found.unit}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Item Not Found Alert */}
      {code.trim() && !found && (
        <div className="bg-rose-50 rounded-2xl p-3.5 border border-rose-200/80 text-xs font-semibold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>
            {t(
              lang,
              "No item found for this code.",
              "මෙම කේතය සඳහා භාණ්ඩ හමුනොවිය."
            )}
          </span>
        </div>
      )}
    </div>
  );
}