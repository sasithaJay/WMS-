import { useCallback, useEffect, useState } from "react";
import { Package } from "lucide-react";
import { t } from "../../constants/translations";
import { InventorySummary } from "./InventorySummary";
import { StockBalanceTable } from "./StockBalanceTable";
import { ItemRegistrationForm } from "./ItemRegistrationForm";
import { getItems } from "../../../services/ItemService";
import type {
  InventoryItem,
  PaginatedItems,
} from "../../types/inventory";
import { Lang } from "../../types";

export function InventoryPage({ lang }: { lang: Lang }) {
  const [showAddItem, setShowAddItem] = useState(false);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);

      const result: PaginatedItems = await getItems({
        per_page: 100,
        is_active: true,
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

  return (
    <div className="space-y-5">
      <InventorySummary
        lang={lang}
        items={items}
        total={total}
      />

      <div className="flex justify-end">
        <button
          onClick={() => setShowAddItem(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all"
        >
          <Package className="w-4 h-4" />
          {t(lang, "Add Item", "භාණ්ඩ එකතු කරන්න")}
        </button>
      </div>

      <StockBalanceTable
        lang={lang}
        items={items}
        loading={loading}
      />

      {showAddItem && (
        <ItemRegistrationForm
          lang={lang}
          onClose={() => setShowAddItem(false)}
          onCreated={loadItems}
        />
      )}
    </div>
  );
}