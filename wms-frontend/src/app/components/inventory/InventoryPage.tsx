import { useCallback, useEffect, useState } from "react";
import { Package, ClipboardList, Printer, Plus } from "lucide-react";

import { t } from "../../constants/translations";
import { InventorySummary } from "./InventorySummary";
import { StockBalanceTable } from "./StockBalanceTable";
import { ItemRegistrationForm } from "./ItemRegistrationForm";
import { MyItemUpdateRequestsTable } from "./MyItemUpdateRequestsTable";
import { PrintableItemLabels } from "../ui/PrintableItemLabels";

import {
  getItems,
  toggleItemStatus,
} from "../../../services/ItemService";

import type {
  InventoryItem,
  PaginatedItems,
} from "../../types/inventory";

import type { Lang } from "../../types";

interface InventoryPageProps {
  lang: Lang;
  userRole: string;
}

export function InventoryPage({
  lang,
  userRole,
}: InventoryPageProps) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showLabels, setShowLabels] = useState(false);

  function handleToggleSelect(id: number) {
    setSelectedIds((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleToggleSelectAll(ids: number[]) {
    setSelectedIds((current) => {
      const allSelected = ids.every((id) => current.has(id));
      if (allSelected) {
        const next = new Set(current);
        ids.forEach((id) => next.delete(id));
        return next;
      }
      return new Set([...current, ...ids]);
    });
  }

  const selectedItems = items.filter((i) => selectedIds.has(i.id));

  const [showItemForm, setShowItemForm] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const [activeTab, setActiveTab] = useState<"stock" | "my-updates">("stock");
  const [updateRequestsRefreshSignal, setUpdateRequestsRefreshSignal] = useState(0);

  const normalizedRole = userRole
    ?.trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  const canManageItems = normalizedRole === "STORE_KEEPER";

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);

      const result: PaginatedItems = await getItems({
        per_page: 100,
      });

      setItems(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error("Failed to load inventory items:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  function handleAddItem() {
    setSelectedItem(null);
    setShowItemForm(true);
  }

  function handleEdit(item: InventoryItem) {
    setSelectedItem(item);
    setShowItemForm(true);
  }

  async function handleToggleStatus(item: InventoryItem) {
    try {
      await toggleItemStatus(item.id);
      await loadItems();
    } catch (error) {
      console.error("Failed to update item status:", error);
    }
  }

  async function handleSaved() {
    await loadItems();

    if (selectedItem) {
      setUpdateRequestsRefreshSignal((s) => s + 1);
    }

    setShowItemForm(false);
    setSelectedItem(null);
  }

  function handleCloseForm() {
    setShowItemForm(false);
    setSelectedItem(null);
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* SUMMARY CARDS */}
      <InventorySummary
        lang={lang}
        items={items}
        total={total}
      />

      {/* HEADER TABS & ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {canManageItems ? (
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab("stock")}
              className={`flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "stock"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>{t(lang, "Stock Balance", "තොග ශේෂය")}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("my-updates")}
              className={`flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === "my-updates"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              <span>{t(lang, "My Update Requests", "මගේ යාවත්කාලීන ඉල්ලීම්")}</span>
            </button>
          </div>
        ) : (
          <div />
        )}

        {/* ACTION BUTTONS */}
        <div className="flex items-center gap-2 shrink-0">
          {selectedIds.size > 0 && (
            <button
              type="button"
              onClick={() => setShowLabels(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>
                {t(
                  lang,
                  `Print Labels (${selectedIds.size})`,
                  `ලේබල් මුද්‍රණය (${selectedIds.size})`
                )}
              </span>
            </button>
          )}

          {canManageItems && activeTab === "stock" && (
            <button
              type="button"
              onClick={handleAddItem}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>{t(lang, "Add Item", "භාණ්ඩ එකතු කරන්න")}</span>
            </button>
          )}
        </div>
      </div>

      {/* STOCK BALANCE TABLE */}
      {activeTab === "stock" && (
        <StockBalanceTable
          lang={lang}
          items={items}
          loading={loading}
          canManageItems={canManageItems}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
          onToggleSelect={handleToggleSelect}
          onToggleSelectAll={handleToggleSelectAll}
          selectedIds={selectedIds}
        />
      )}

      {/* PRINT LABELS MODAL */}
      {showLabels && (
        <PrintableItemLabels
          lang={lang}
          items={selectedItems}
          onClose={() => setShowLabels(false)}
        />
      )}

      {/* UPDATE REQUESTS TAB */}
      {activeTab === "my-updates" && canManageItems && (
        <MyItemUpdateRequestsTable
          lang={lang}
          refreshSignal={updateRequestsRefreshSignal}
        />
      )}

      {/* ITEM REGISTRATION / EDIT FORM MODAL */}
      {showItemForm && (
        <ItemRegistrationForm
          lang={lang}
          item={selectedItem}
          onClose={handleCloseForm}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}