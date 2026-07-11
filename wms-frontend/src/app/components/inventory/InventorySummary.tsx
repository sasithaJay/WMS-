import { Package, AlertTriangle, CheckCircle } from "lucide-react";
import { StatCard } from "../common/StatCard";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { InventoryItem } from "../../types/inventory";

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        value={low}
        color="red"
        icon={<AlertTriangle className="w-5 h-5" />}
      />

      <StatCard
        label={t(lang, "Normal Stock", "සාමාන්‍ය")}
        value={normal}
        color="green"
        icon={<CheckCircle className="w-5 h-5" />}
      />
    </div>
  );
}