import { useCallback, useEffect, useState } from "react";
import { Package, ClipboardList } from "lucide-react";

import { t } from "../../constants/translations";
import { InventorySummary } from "./InventorySummary";
import { StockBalanceTable } from "./StockBalanceTable";
import { ItemRegistrationForm } from "./ItemRegistrationForm";
import { MyItemUpdateRequestsTable } from "./MyItemUpdateRequestsTable";

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

  const [showItemForm, setShowItemForm] = useState(false);

  const [selectedItem, setSelectedItem] =
    useState<InventoryItem | null>(null);

  const [activeTab, setActiveTab] = useState<"stock" | "my-updates">("stock");
  const [updateRequestsRefreshSignal, setUpdateRequestsRefreshSignal] = useState(0);

  const normalizedRole = userRole
    ?.trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

  const canManageItems =
    normalizedRole === "STORE_KEEPER";

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);

      const result: PaginatedItems = await getItems({
        per_page: 100,
      });

      setItems(result.data);
      setTotal(result.total);
    } catch (error) {
      console.error(
        "Failed to load inventory items:",
        error,
      );
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

  async function handleToggleStatus(
    item: InventoryItem,
  ) {
    try {
      await toggleItemStatus(item.id);
      await loadItems();
    } catch (error) {
      console.error(
        "Failed to update item status:",
        error,
      );
    }
  }

  async function handleSaved() {
    await loadItems();

    // If this was an edit (update request), refresh the "My Update
    // Requests" tab too, so the newly submitted request shows up
    // immediately if the store keeper switches over to check it.
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
    <div className="space-y-5">
      <InventorySummary
        lang={lang}
        items={items}
        total={total}
      />

      <div className="flex items-center justify-between">
        {canManageItems ? (
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
            <button
              type="button"
              onClick={() => setActiveTab("stock")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === "stock"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              {t(lang, "Stock Balance", "තොග ශේෂය")}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("my-updates")}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeTab === "my-updates"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              {t(lang, "My Update Requests", "මගේ යාවත්කාලීන ඉල්ලීම්")}
            </button>
          </div>
        ) : (
          <div />
        )}

        {canManageItems && activeTab === "stock" && (
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-2 px-4 py-2 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all"
          >
            <Package className="w-4 h-4" />

            {t(
              lang,
              "Add Item",
              "භාණ්ඩ එකතු කරන්න",
            )}
          </button>
        )}
      </div>

      {activeTab === "stock" && (
        <StockBalanceTable
          lang={lang}
          items={items}
          loading={loading}
          canManageItems={canManageItems}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
        />
      )}

      {activeTab === "my-updates" && canManageItems && (
        <MyItemUpdateRequestsTable
          lang={lang}
          refreshSignal={updateRequestsRefreshSignal}
        />
      )}

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