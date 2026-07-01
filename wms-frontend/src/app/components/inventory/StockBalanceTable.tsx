import { useState } from "react";
import { t } from "../../constants/translations";
import { INVENTORY_ITEMS } from "../../constants/mockData";
import type { Lang } from "../../types";

export function StockBalanceTable({ lang }: { lang: Lang }) {
  const [search, setSearch] = useState("");
  const filtered = INVENTORY_ITEMS.filter(
    (it) => it.name.toLowerCase().includes(search.toLowerCase()) || it.code.toLowerCase().includes(search.toLowerCase()) || it.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="flex items-center px-5 py-4 border-b border-gray-100 gap-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t(lang, "Search by name, code, or category…", "නාමය, කේතය, හෝ ප්‍රවර්ගය…")}
          className="flex-1 max-w-sm px-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white"
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {[
                t(lang, "Item Code", "භාණ්ඩ කේතය"),
                t(lang, "Item Name", "භාණ්ඩ නාමය"),
                t(lang, "Category", "ප්‍රවර්ගය"),
                t(lang, "Unit", "ඒකකය"),
                t(lang, "Current Qty", "වත්මන් ප්‍රමාණය"),
                t(lang, "Reorder Level", "නැවත ඇණවුම් මට්ටම"),
                t(lang, "Status", "තත්ත්වය"),
              ].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.map((it) => {
              const isLow = it.qty <= it.reorder;
              return (
                <tr key={it.code} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-500">{it.code}</td>
                  <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">{it.name}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{it.category}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs">{it.unit}</td>
                  <td className={`px-5 py-3.5 font-bold text-sm ${isLow ? "text-red-600" : "text-gray-900"}`}>{it.qty}</td>
                  <td className="px-5 py-3.5 text-gray-500 text-sm">{it.reorder}</td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${isLow ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                      {isLow ? t(lang, "Low Stock", "අඩු") : t(lang, "Normal", "සාමාන්‍ය")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
