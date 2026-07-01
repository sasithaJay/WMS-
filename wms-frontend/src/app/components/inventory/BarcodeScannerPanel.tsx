import { useState } from "react";
import { Search } from "lucide-react";
import { INVENTORY_ITEMS } from "../../constants/mockData";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";

export function BarcodeScannerPanel({ lang }: { lang: Lang }) {
  const [code, setCode] = useState("");
  const found = INVENTORY_ITEMS.find((it) => it.code.toLowerCase() === code.toLowerCase() || it.name.toLowerCase().includes(code.toLowerCase()));

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-4 max-w-md">
      <h3 className="font-semibold text-gray-900">{t(lang, "Barcode / Item Lookup", "බාකෝඩ / භාණ්ඩ සෙවීම")}</h3>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t(lang, "Enter item code or barcode…", "භාණ්ඩ කේතය හෝ බාකෝඩය ඇතුලත් කරන්න…")}
          className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white"
        />
      </div>
      {code && found && (
        <div className="bg-[#EBF4FD] rounded-xl p-4 border border-blue-100">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{t(lang, "Item Found", "භාණ්ඩය හමුවිය")}</div>
          <div className="font-bold text-gray-900">{found.name}</div>
          <div className="text-xs text-gray-500 mt-1">{found.code} · {found.category} · {found.division}</div>
          <div className="mt-3 flex gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-400">{t(lang, "Current Qty", "වත්මන් ප්‍රමාණය")}</div>
              <div className={`font-bold ${found.qty <= found.reorder ? "text-red-600" : "text-gray-900"}`}>{found.qty} {found.unit}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">{t(lang, "Reorder Level", "නැවත ඇණවුම්")}</div>
              <div className="font-bold text-gray-900">{found.reorder}</div>
            </div>
          </div>
        </div>
      )}
      {code && !found && (
        <div className="bg-red-50 rounded-xl p-4 border border-red-100 text-sm text-red-700">
          {t(lang, "No item found for this code.", "මෙම කේතය සඳහා භාණ්ඩ හමුනොවිය.")}
        </div>
      )}
    </div>
  );
}
