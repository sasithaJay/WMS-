import { useMemo, useState } from "react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { InventoryItem } from "../../types/inventory";

interface StockBalanceTableProps {
  lang: Lang;
  items: InventoryItem[];
  loading: boolean;
}

export function StockBalanceTable({
  lang,
  items,
  loading,
}: StockBalanceTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    if (!searchValue) {
      return items;
    }

    return items.filter((item) => {
      return (
        item.name_en.toLowerCase().includes(searchValue) ||
        item.name_si?.toLowerCase().includes(searchValue) ||
        item.item_code.toLowerCase().includes(searchValue) ||
        item.category.name_en
          .toLowerCase()
          .includes(searchValue) ||
        item.category.name_si
          ?.toLowerCase()
          .includes(searchValue)
      );
    });
  }, [items, search]);

  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="flex items-center px-5 py-4 border-b border-gray-100 gap-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t(
            lang,
            "Search by name, code, or category…",
            "නාමය, කේතය, හෝ ප්‍රවර්ගය…",
          )}
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
                t(
                  lang,
                  "Reorder Level",
                  "නැවත ඇණවුම් මට්ටම",
                ),
                t(lang, "Status", "තත්ත්වය"),
              ].map((heading) => (
                <th
                  key={heading}
                  className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-10 text-center text-gray-500"
                >
                  {t(lang, "Loading items...", "භාණ්ඩ පූරණය වෙමින්...")}
                </td>
              </tr>
            )}

            {!loading &&
              filtered.map((item) => {
                const quantity =
                  item.balance?.quantity_on_hand ?? 0;

                const stockStatus =
                  quantity === 0
                    ? "out"
                    : quantity <= item.reorder_level
                      ? "low"
                      : "normal";

                const isLow =
                  quantity <= item.reorder_level;

                const itemName =
                  lang === "si" && item.name_si
                    ? item.name_si
                    : item.name_en;

                const categoryName =
                  lang === "si" && item.category.name_si
                    ? item.category.name_si
                    : item.category.name_en;

                const unitName =
                  lang === "si" && item.unit.name_si
                    ? item.unit.name_si
                    : item.unit.name_en;

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-500">
                      {item.item_code}
                    </td>

                    <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                      {itemName}
                    </td>

                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {categoryName}
                    </td>

                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {unitName}
                    </td>

                    {/* <td
                      className={`px-5 py-3.5 font-bold text-sm ${
                        isLow
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {quantity}
                    </td> */}
                    <td
                      className={`px-5 py-3.5 font-bold text-sm ${
                        quantity === 0
                          ? "text-red-600"
                          : quantity <= item.reorder_level
                            ? "text-amber-600"
                            : "text-gray-900"
                      }`}
                    >
                      {quantity}
                    </td>

                    <td className="px-5 py-3.5 text-gray-500 text-sm">
                      {item.reorder_level}
                    </td>

                    {/* <td className="px-5 py-3.5">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          isLow
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {isLow
                          ? t(lang, "Low Stock", "අඩු")
                          : t(lang, "Normal", "සාමාන්‍ය")}
                      </span>
                    </td> */}
                    <td className="px-5 py-3.5">
                    {stockStatus === "out" && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700">
                        {t(lang, "Out of Stock", "තොග නොමැත")}
                      </span>
                    )}

                    {stockStatus === "low" && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                        {t(lang, "Low Stock", "අඩු තොග")}
                      </span>
                    )}

                    {stockStatus === "normal" && (
                      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                        {t(lang, "Normal", "සාමාන්‍ය")}
                      </span>
                    )}
                  </td>
                  </tr>
                );
              })}

            {!loading && filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-5 py-10 text-center text-gray-500"
                >
                  {t(
                    lang,
                    "No items found.",
                    "භාණ්ඩ හමු නොවීය.",
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}