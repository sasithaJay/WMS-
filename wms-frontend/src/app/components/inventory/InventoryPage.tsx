import { useCallback, useEffect, useState } from "react";
import { Package } from "lucide-react";

import { t } from "../../constants/translations";
import { InventorySummary } from "./InventorySummary";
import { StockBalanceTable } from "./StockBalanceTable";
import { ItemRegistrationForm } from "./ItemRegistrationForm";

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

      {canManageItems && (
        <div className="flex justify-end">
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
        </div>
      )}

      <StockBalanceTable
        lang={lang}
        items={items}
        loading={loading}
        canManageItems={canManageItems}
        onEdit={handleEdit}
        onToggleStatus={handleToggleStatus}
      />

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