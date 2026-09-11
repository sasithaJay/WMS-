import { Pencil, Power, Search, Loader2, Inbox, Package, Barcode } from "lucide-react";
import { useMemo, useState } from "react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { InventoryItem } from "../../types/inventory";
import { BarcodeScannerInput } from "../ui/BarcodeScannerInput";

interface StockBalanceTableProps {
  lang: Lang;
  items: InventoryItem[];
  loading: boolean;
  canManageItems: boolean;
  onEdit: (item: InventoryItem) => void;
  onToggleStatus: (item: InventoryItem) => Promise<void>;
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
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);

  const filteredItems = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return items;
    }

    return items.filter((item) => {
      const categoryName = item.category?.name_en ?? "";
      const unitName = item.unit?.name_en ?? "";
      const barcode = item.barcode ?? "";

      return (
        item.item_code.toLowerCase().includes(searchValue) ||
        item.name_en.toLowerCase().includes(searchValue) ||
        categoryName.toLowerCase().includes(searchValue) ||
        unitName.toLowerCase().includes(searchValue) ||
        barcode.toLowerCase().includes(searchValue)
      );
    });
  }, [items, search]);

  async function handleStatusChange(item: InventoryItem) {
    try {
      setUpdatingItemId(item.id);
      await onToggleStatus(item);
    } finally {
      setUpdatingItemId(null);
    }
  }

  const colSpan = canManageItems ? 10 : 9;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* SEARCH AND BARCODE SCANNER CONTROLS */}
      <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
        {/* Search Bar */}
        <div className="w-full sm:max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t(
                lang,
                "Search by name, code, or category...",
                "නාමය, කේතය හෝ ප්‍රවර්ගය අනුව සොයන්න..."
              )}
              className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Barcode Scanner Input */}
        <div className="w-full sm:w-64 shrink-0">
          <BarcodeScannerInput
            lang={lang}
            onScan={(code) => setSearch(code)}
            placeholder={t(
              lang,
              "Scan item barcode…",
              "භාණ්ඩ බාර්කේතය ස්කෑන් කරන්න…"
            )}
          />
        </div>
      </div>

      {/* TABLE / CARD CONTAINER */}
      <div>
        {/* DESKTOP TABLE VIEW (md+) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="px-5 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredItems.length > 0 &&
                      filteredItems.every((i) => selectedIds.has(i.id))
                    }
                    onChange={() =>
                      onToggleSelectAll(filteredItems.map((i) => i.id))
                    }
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                  />
                </th>

                <TableHeading>
                  {t(lang, "Item Code", "භාණ්ඩ කේතය")}
                </TableHeading>

                <TableHeading>
                  {t(lang, "Item Name", "භාණ්ඩ නාමය")}
                </TableHeading>

                <TableHeading>
                  {t(lang, "Category", "ප්‍රවර්ගය")}
                </TableHeading>

                <TableHeading>
                  {t(lang, "Unit", "ඒකකය")}
                </TableHeading>

                <TableHeading>
                  {t(lang, "Current Qty", "වත්මන් ප්‍රමාණය")}
                </TableHeading>

                <TableHeading>
                  {t(lang, "Reorder Level", "නැවත ඇණවුම් මට්ටම")}
                </TableHeading>

                <TableHeading>
                  {t(lang, "Stock Status", "තොග තත්ත්වය")}
                </TableHeading>

                <TableHeading>
                  {t(lang, "Item Status", "භාණ්ඩ තත්ත්වය")}
                </TableHeading>

                {canManageItems && (
                  <TableHeading>
                    {t(lang, "Actions", "ක්‍රියා")}
                  </TableHeading>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {loading && (
                <tr>
                  <td colSpan={colSpan} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="font-semibold">
                        {t(lang, "Loading inventory...", "තොග පූරණය වෙමින්...")}
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filteredItems.length === 0 && (
                <tr>
                  <td colSpan={colSpan} className="px-5 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                        <Inbox className="w-5 h-5" />
                      </div>
                      <span className="font-medium text-slate-500">
                        {t(lang, "No inventory items found.", "තොග භාණ්ඩ හමු නොවීය.")}
                      </span>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                filteredItems.map((item) => {
                  const quantity = item.balance?.quantity_on_hand ?? 0;
                  const stockStatus = getStockStatus(quantity, item.reorder_level);
                  const isUpdating = updatingItemId === item.id;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        !item.is_active ? "opacity-60 bg-slate-50/40" : ""
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => onToggleSelect(item.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                        />
                      </td>

                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-slate-800 whitespace-nowrap">
                        {item.item_code}
                      </td>

                      <td className="px-5 py-3.5 font-bold text-slate-900 whitespace-nowrap">
                        {item.name_en}
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 font-medium whitespace-nowrap">
                        {lang === "si" && item.category.name_si
                          ? item.category.name_si
                          : item.category.name_en}
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 font-medium whitespace-nowrap">
                        {lang === "si" && item.unit.name_si
                          ? item.unit.name_si
                          : item.unit.name_en}
                      </td>

                      <td
                        className={`px-5 py-3.5 font-extrabold font-mono ${
                          stockStatus === "out"
                            ? "text-rose-600"
                            : stockStatus === "low"
                            ? "text-amber-600"
                            : "text-slate-900"
                        }`}
                      >
                        {quantity}
                      </td>

                      <td className="px-5 py-3.5 text-slate-500 font-semibold font-mono">
                        {item.reorder_level}
                      </td>

                      <td className="px-5 py-3.5">
                        <StockStatusBadge lang={lang} status={stockStatus} />
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            item.is_active
                              ? "bg-blue-50 text-blue-700 border-blue-200/80"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {item.is_active
                            ? t(lang, "Active", "සක්‍රීය")
                            : t(lang, "Inactive", "අක්‍රීය")}
                        </span>
                      </td>

                      {canManageItems && (
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onEdit(item)}
                              disabled={isUpdating}
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200/60 transition-all cursor-pointer disabled:opacity-50"
                              title={t(lang, "Edit Item", "භාණ්ඩය සංස්කරණය කරන්න")}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              disabled={isUpdating}
                              onClick={() => void handleStatusChange(item)}
                              className={`w-8 h-8 flex items-center justify-center rounded-xl border border-slate-200/60 transition-all cursor-pointer disabled:opacity-50 ${
                                item.is_active
                                  ? "bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600"
                                  : "bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600"
                              }`}
                              title={
                                item.is_active
                                  ? t(lang, "Deactivate", "අක්‍රීය කරන්න")
                                  : t(lang, "Activate", "සක්‍රීය කරන්න")
                              }
                            >
                              {isUpdating ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Power className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW (<md) */}
        <div className="block md:hidden divide-y divide-slate-100">
          {loading && (
            <div className="p-8 text-center text-slate-400 flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-xs font-semibold">
                {t(lang, "Loading inventory...", "තොග පූරණය වෙමින්...")}
              </span>
            </div>
          )}

          {!loading && filteredItems.length === 0 && (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
                <Inbox className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-500">
                {t(lang, "No inventory items found.", "තොග භාණ්ඩ හමු නොවීය.")}
              </p>
            </div>
          )}

          {!loading &&
            filteredItems.map((item) => {
              const quantity = item.balance?.quantity_on_hand ?? 0;
              const stockStatus = getStockStatus(quantity, item.reorder_level);
              const isUpdating = updatingItemId === item.id;

              return (
                <div key={item.id} className="p-4 space-y-3 bg-white">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => onToggleSelect(item.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/20 cursor-pointer"
                      />
                      <div>
                        <span className="font-mono text-xs font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                          {item.item_code}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">
                          {item.name_en}
                        </h4>
                      </div>
                    </div>

                    <StockStatusBadge lang={lang} status={stockStatus} />
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/60 p-2.5 rounded-xl border border-slate-100">
                    <div>
                      <span className="text-slate-400 font-medium block">
                        {t(lang, "Category", "ප්‍රවර්ගය")}
                      </span>
                      <span className="font-bold text-slate-700">
                        {lang === "si" && item.category.name_si
                          ? item.category.name_si
                          : item.category.name_en}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">
                        {t(lang, "Unit", "ඒකකය")}
                      </span>
                      <span className="font-bold text-slate-700">
                        {lang === "si" && item.unit.name_si
                          ? item.unit.name_si
                          : item.unit.name_en}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">
                        {t(lang, "Current Qty", "වත්මන් ප්‍රමාණය")}
                      </span>
                      <span
                        className={`font-extrabold font-mono ${
                          stockStatus === "out"
                            ? "text-rose-600"
                            : stockStatus === "low"
                            ? "text-amber-600"
                            : "text-slate-900"
                        }`}
                      >
                        {quantity}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 font-medium block">
                        {t(lang, "Reorder Level", "නැවත ඇණවුම් මට්ටම")}
                      </span>
                      <span className="font-bold font-mono text-slate-700">
                        {item.reorder_level}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        item.is_active
                          ? "bg-blue-50 text-blue-700 border-blue-200/80"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {item.is_active
                        ? t(lang, "Active", "සක්‍රීය")
                        : t(lang, "Inactive", "අක්‍රීය")}
                    </span>

                    {canManageItems && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          disabled={isUpdating}
                          className="px-3 py-1 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200/60 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Pencil className="w-3 h-3" />
                          <span>{t(lang, "Edit", "සංස්කරණය")}</span>
                        </button>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() => void handleStatusChange(item)}
                          className={`px-3 py-1 border border-slate-200/60 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            item.is_active
                              ? "bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600"
                              : "bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-600"
                          }`}
                        >
                          {isUpdating ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Power className="w-3 h-3" />
                          )}
                          <span>
                            {item.is_active
                              ? t(lang, "Deactivate", "අක්‍රීය කරන්න")
                              : t(lang, "Activate", "සක්‍රීය කරන්න")}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}

interface TableHeadingProps {
  children: React.ReactNode;
}

function TableHeading({ children }: TableHeadingProps) {
  return (
    <th className="text-left px-5 py-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
      {children}
    </th>
  );
}

type StockStatus = "out" | "low" | "normal";

function getStockStatus(quantity: number, reorderLevel: number): StockStatus {
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

function StockStatusBadge({ lang, status }: StockStatusBadgeProps) {
  if (status === "out") {
    return (
      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 whitespace-nowrap">
        {t(lang, "Out of Stock", "තොග නොමැත")}
      </span>
    );
  }

  if (status === "low") {
    return (
      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80 whitespace-nowrap">
        {t(lang, "Low Stock", "අඩු තොග")}
      </span>
    );
  }

  return (
    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 whitespace-nowrap">
      {t(lang, "Normal", "සාමාන්‍ය")}
    </span>
  );
}