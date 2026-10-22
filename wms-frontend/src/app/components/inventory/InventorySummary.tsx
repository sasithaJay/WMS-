import { useMemo } from "react";
import { Package, AlertTriangle, CheckCircle2, AlertCircle } from "lucide-react";
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
  // Memoized counts using getStockStatus helper to avoid unnecessary recalculations
  const { lowStockCount, normalCount, outOfStockCount } = useMemo(() => {
    let lowStock = 0;
    let normal = 0;
    let outOfStock = 0;

    items.forEach((item) => {
      const status = getStockStatus(item);
      if (status === "low_stock") lowStock++;
      else if (status === "normal") normal++;
      else if (status === "out_of_stock") outOfStock++;
    });

    return {
      lowStockCount: lowStock,
      normalCount: normal,
      outOfStockCount: outOfStock,
    };
  }, [items]);

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:gap-4 lg:grid-cols-4">
      {/* Total Items Card */}
      <StatCard
        label={t(lang, "Total Items", "මුළු භාණ්ඩ")}
        value={total}
        color="blue"
        icon={<Package className="w-5 h-5" />}
      />

      {/* Low Stock Warning Card */}
      <StatCard
        label={t(lang, "Low / Critical Stock", "අඩු / බරපතල")}
        value={lowStockCount}
        color="amber"
        icon={<AlertTriangle className="w-5 h-5" />}
      />

      {/* Normal Stock Card */}
      <StatCard
        label={t(lang, "Normal Stock", "සාමාන්‍ය")}
        value={normalCount}
        color="green"
        icon={<CheckCircle2 className="w-5 h-5" />}
      />

      {/* Out of Stock Card */}
      <StatCard
        label={t(lang, "Out of Stock", "තොග නොමැත")}
        value={outOfStockCount}
        color="red"
        icon={<AlertCircle className="w-5 h-5" />}
      />
    </div>
  );
}
