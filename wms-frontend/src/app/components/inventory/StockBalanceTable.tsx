import {
  Pencil,
  Power,
  Search,
} from "lucide-react";

import { useMemo, useState } from "react";

import { t } from "../../constants/translations";

import type { Lang } from "../../types";

import type {
  InventoryItem,
} from "../../types/inventory";
import { BarcodeScannerInput } from "../ui/BarcodeScannerInput";

interface StockBalanceTableProps {
  lang: Lang;
  items: InventoryItem[];
  loading: boolean;
  canManageItems: boolean;
  onEdit: (item: InventoryItem) => void;
  onToggleStatus: (
    item: InventoryItem,
  ) => Promise<void>;
  selectedIds: Set<number>;
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: (ids: number[]) => void;
}

export function StockBalanceTable({
  lang,
  items,
  loading,
  canManageItems,
  onEdit,
  onToggleStatus,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: StockBalanceTableProps) {
  const [search, setSearch] = useState("");
  const [updatingItemId, setUpdatingItemId] =
    useState<number | null>(null);

  const filteredItems = useMemo(() => {
    const searchValue = search
      .trim()
      .toLowerCase();

    if (!searchValue) {
      return items;
    }

    return items.filter((item) => {
      const categoryName =
        item.category?.name_en ?? "";

      const unitName =
        item.unit?.name_en ?? "";

      const barcode = item.barcode ?? "";

      return (
        item.item_code
          .toLowerCase()
          .includes(searchValue) ||
        item.name_en
          .toLowerCase()
          .includes(searchValue) ||
        categoryName
          .toLowerCase()
          .includes(searchValue) ||
        unitName
          .toLowerCase()
          .includes(searchValue) ||
        barcode.toLowerCase().includes(searchValue)
      );
    });
  }, [items, search]);

  async function handleStatusChange(
    item: InventoryItem,
  ) {
    try {
      setUpdatingItemId(item.id);
      await onToggleStatus(item);
    } finally {
      setUpdatingItemId(null);
    }
  }

  const colSpan = canManageItems ? 10 : 9;

  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">

      <div className="flex flex-col sm:flex-row gap-3 m-4">
        {/* Search */}
        <div className="w-full sm:max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t(
                lang,
                "Search by name, code, or category...",
                "නාමය, කේතය හෝ ප්‍රවර්ගය අනුව සොයන්න...",
              )}
              className="w-full pl-9 pr-3.5 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Barcode Scanner */}
        <div className="w-full sm:w-64">
          <BarcodeScannerInput
            lang={lang}
            onScan={(code) => setSearch(code)}
            placeholder={t(
              lang,
              "Scan item barcode…",
              "භාණ්ඩ බාර්කේතය ස්කෑන් කරන්න…",
            )}
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-5 py-3 w-10">
                <input
                  type="checkbox"
                  checked={filteredItems.length > 0 && filteredItems.every((i) => selectedIds.has(i.id))}
                  onChange={() => onToggleSelectAll(filteredItems.map((i) => i.id))}
                  className="rounded border-gray-300"
                />
              </th>

              <TableHeading>
                {t(
                  lang,
                  "Item Code",
                  "භාණ්ඩ කේතය",
                )}
              </TableHeading>

              <TableHeading>
                {t(
                  lang,
                  "Item Name",
                  "භාණ්ඩ නාමය",
                )}
              </TableHeading>

              <TableHeading>
                {t(
                  lang,
                  "Category",
                  "ප්‍රවර්ගය",
                )}
              </TableHeading>

              <TableHeading>
                {t(lang, "Unit", "ඒකකය")}
              </TableHeading>

              <TableHeading>
                {t(
                  lang,
                  "Current Qty",
                  "වත්මන් ප්‍රමාණය",
                )}
              </TableHeading>

              <TableHeading>
                {t(
                  lang,
                  "Reorder Level",
                  "නැවත ඇණවුම් මට්ටම",
                )}
              </TableHeading>

              <TableHeading>
                {t(
                  lang,
                  "Stock Status",
                  "තොග තත්ත්වය",
                )}
              </TableHeading>

              <TableHeading>
                {t(
                  lang,
                  "Item Status",
                  "භාණ්ඩ තත්ත්වය",
                )}
              </TableHeading>

              {canManageItems && (
                <TableHeading>
                  {t(
                    lang,
                    "Actions",
                    "ක්‍රියා",
                  )}
                </TableHeading>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-50">
            {loading && (
              <tr>
                <td
                  colSpan={colSpan}
                  className="px-5 py-10 text-center text-gray-500"
                >
                  {t(
                    lang,
                    "Loading inventory...",
                    "තොග පූරණය වෙමින්...",
                  )}
                </td>
              </tr>
            )}

            {!loading &&
              filteredItems.map((item) => {
                const quantity =
                  item.balance
                    ?.quantity_on_hand ?? 0;

                const stockStatus =
                  getStockStatus(
                    quantity,
                    item.reorder_level,
                  );

                const isUpdating =
                  updatingItemId === item.id;

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50/50 transition-colors ${
                      !item.is_active
                        ? "opacity-60 bg-gray-50/40"
                        : ""
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => onToggleSelect(item.id)}
                        className="rounded border-gray-300"
                      />
                    </td>

                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-500 whitespace-nowrap">
                      {item.item_code}
                    </td>

                    <td className="px-5 py-3.5 font-medium text-gray-900 whitespace-nowrap">
                      {item.name_en}
                    </td>

                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {lang === "si" &&
                      item.category.name_si
                        ? item.category.name_si
                        : item.category.name_en}
                    </td>

                    <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                      {lang === "si" &&
                      item.unit.name_si
                        ? item.unit.name_si
                        : item.unit.name_en}
                    </td>

                    <td
                      className={`px-5 py-3.5 font-bold ${
                        stockStatus === "out"
                          ? "text-red-600"
                          : stockStatus === "low"
                            ? "text-amber-600"
                            : "text-gray-900"
                      }`}
                    >
                      {quantity}
                    </td>

                    <td className="px-5 py-3.5 text-gray-500">
                      {item.reorder_level}
                    </td>

                    <td className="px-5 py-3.5">
                      <StockStatusBadge
                        lang={lang}
                        status={stockStatus}
                      />
                    </td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                          item.is_active
                            ? "bg-blue-100 text-blue-700"
                            : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {item.is_active
                          ? t(
                              lang,
                              "Active",
                              "සක්‍රීය",
                            )
                          : t(
                              lang,
                              "Inactive",
                              "අක්‍රීය",
                            )}
                      </span>
                    </td>

                    {canManageItems && (
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onEdit(item)
                            }
                            disabled={isUpdating}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title={t(
                              lang,
                              "Edit Item",
                              "භාණ්ඩය සංස්කරණය කරන්න",
                            )}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            disabled={isUpdating}
                            onClick={() =>
                              void handleStatusChange(
                                item,
                              )
                            }
                            className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                              item.is_active
                                ? "text-red-600 hover:bg-red-50"
                                : "text-green-600 hover:bg-green-50"
                            }`}
                            title={
                              item.is_active
                                ? t(
                                    lang,
                                    "Deactivate",
                                    "අක්‍රීය කරන්න",
                                  )
                                : t(
                                    lang,
                                    "Activate",
                                    "සක්‍රීය කරන්න",
                                  )
                            }
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}

            {!loading &&
              filteredItems.length === 0 && (
                <tr>
                  <td
                    colSpan={colSpan}
                    className="px-5 py-10 text-center text-gray-500"
                  >
                    {t(
                      lang,
                      "No inventory items found.",
                      "තොග භාණ්ඩ හමු නොවීය.",
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

interface TableHeadingProps {
  children: React.ReactNode;
}

function TableHeading({
  children,
}: TableHeadingProps) {
  return (
    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
      {children}
    </th>
  );
}

type StockStatus =
  | "out"
  | "low"
  | "normal";

function getStockStatus(
  quantity: number,
  reorderLevel: number,
): StockStatus {
  if (quantity === 0) {
    return "out";
  }

  if (quantity <= reorderLevel) {
    return "low";
  }

  return "normal";
}

interface StockStatusBadgeProps {
  lang: Lang;
  status: StockStatus;
}

function StockStatusBadge({
  lang,
  status,
}: StockStatusBadgeProps) {
  if (status === "out") {
    return (
      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-red-100 text-red-700 whitespace-nowrap">
        {t(
          lang,
          "Out of Stock",
          "තොග නොමැත",
        )}
      </span>
    );
  }

  if (status === "low") {
    return (
      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 whitespace-nowrap">
        {t(
          lang,
          "Low Stock",
          "අඩු තොග",
        )}
      </span>
    );
  }

  return (
    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-green-100 text-green-700 whitespace-nowrap">
      {t(
        lang,
        "Normal",
        "සාමාන්‍ය",
      )}
    </span>
  );
}