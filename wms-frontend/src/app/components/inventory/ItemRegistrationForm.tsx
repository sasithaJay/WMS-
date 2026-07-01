import { useState } from "react";
import { X } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";

export function ItemRegistrationForm({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const [newItem, setNewItem] = useState({ name: "", category: "", code: "", unit: "", qty: "", reorder: "", barcode: "" });
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{t(lang, "Add New Item", "නව භාණ්ඩ එකතු කරන්න")}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          {[
            { key: "name", label: "Item Name", labelSi: "භාණ්ඩ නාමය" },
            { key: "category", label: "Category", labelSi: "ප්‍රවර්ගය" },
            { key: "code", label: "Item Code", labelSi: "භාණ්ඩ කේතය" },
            { key: "unit", label: "Unit", labelSi: "ඒකකය" },
            { key: "qty", label: "Starting Quantity", labelSi: "ආරම්භක ප්‍රමාණය", type: "number" },
            { key: "reorder", label: "Reorder Level", labelSi: "නැවත ඇණවුම් මට්ටම", type: "number" },
            { key: "barcode", label: "Barcode (optional)", labelSi: "බාකෝඩය (අවශ්‍ය නම්)" },
          ].map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t(lang, f.label, f.labelSi)}</label>
              <input
                type={f.type || "text"}
                value={(newItem as Record<string, string>)[f.key]}
                onChange={(e) => setNewItem((n) => ({ ...n, [f.key]: e.target.value }))}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white"
              />
            </div>
          ))}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
            {t(lang, "Cancel", "අවලංගු")}
          </button>
          <button onClick={onClose} className="flex-1 py-2.5 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all">
            {t(lang, "Add Item", "භාණ්ඩ එකතු කරන්න")}
          </button>
        </div>
      </div>
    </div>
  );
}
