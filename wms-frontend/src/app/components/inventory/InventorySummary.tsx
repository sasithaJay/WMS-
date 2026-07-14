import { Package, AlertTriangle, CheckCircle } from "lucide-react";
import { StatCard } from "../common/StatCard";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { InventoryItem } from "../../types/inventory";
import { getStockStatus } from "../../utils/inventoryHelpers";

interface InventorySummaryProps {
  lang: Lang;
  items: InventoryItem[];
  total: number;
}

export function InventorySummary({
  lang,
  items,
  total,
}: InventorySummaryProps) {
  const low = items.filter((item) => {
    const quantity = item.balance?.quantity_on_hand ?? 0;

    return quantity <= item.reorder_level;
  }).length;

  const normal = items.filter((item) => {
    const quantity = item.balance?.quantity_on_hand ?? 0;

    return quantity > item.reorder_level;
  }).length;

  return (
    <div className="grid grid-cols-1 min-[700px]:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label={t(lang, "Total Items", "මුළු භාණ්ඩ")}
        value={total}
        color="blue"
        icon={<Package className="w-5 h-5" />}
      />

      <StatCard
        label={t(
          lang,
          "Low / Critical Stock",
          "අඩු / බරපතල",
        )}
        //value={low}
        value={items.filter((item) => getStockStatus(item) === "low_stock").length}
        color="amber"
        icon={<AlertTriangle className="w-5 h-5" />}
      />

      <StatCard
        label={t(lang, "Normal Stock", "සාමාන්‍ය")}
        value={items.filter((item) => getStockStatus(item) === "normal").length}
        color="green"
        icon={<CheckCircle className="w-5 h-5" />}
      />

      <StatCard
        label={t(lang, "Out of Stock", "අවස්ථාවේ")}
        value={items.filter((item) => getStockStatus(item) === "out_of_stock").length}
        color="red"
        icon={<AlertTriangle className="w-5 h-5" />}
      />
    </div>
  );
}