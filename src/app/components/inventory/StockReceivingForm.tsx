import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { INVENTORY_ITEMS, GRN_DATA } from "../../constants/mockData";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";

export function StockReceivingForm({ lang }: { lang: Lang }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ item: "", qty: "", date: "", supplier: "", grn: "" });
  const setF = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{GRN_DATA.length} {t(lang, "receipts recorded", "රිසිට් සටහන් කර ඇත")}</p>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex items-center gap-2 px-4 py-2 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          {t(lang, "Record Receipt", "රිසිට් සටහන් කරන්න")}
        </button>
      </div>
      {showForm && (
        <div className="bg-white rounded-xl border border-[#4295D9]/30 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-gray-900 text-sm">{t(lang, "New Stock Receipt", "නව ගබඩා රිසිට්")}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1.5">{t(lang, "Item", "භාණ්ඩය")}</label>
              <select value={form.item} onChange={(e) => setF("item", e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 appearance-none">
                <option value="">{t(lang, "Select item…", "භාණ්ඩය තෝරන්න…")}</option>
                {INVENTORY_ITEMS.map((it) => <option key={it.code} value={it.code}>{it.name}</option>)}
              </select>
            </div>
            {[
              { key: "qty", label: "Quantity Received", labelSi: "ලැබුණු ප්‍රමාණය", type: "number" },
              { key: "date", label: "Date", labelSi: "දිනය", type: "date" },
              { key: "supplier", label: "Supplier Name", labelSi: "සැපයුම්කරු නාමය" },
              { key: "grn", label: "GRN Number", labelSi: "GRN අංකය" },
            ].map((f) => (
              <div key={f.key}>
                <label className="block text-xs font-medium text-gray-600 mb-1.5">{t(lang, f.label, f.labelSi)}</label>
                <input type={f.type || "text"} value={(form as Record<string, string>)[f.key]}
                  onChange={(e) => setF(f.key, e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white" />
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
              {t(lang, "Cancel", "අවලංගු")}
            </button>
            <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all">
              {t(lang, "Save Receipt", "රිසිට් සුරකින්න")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
