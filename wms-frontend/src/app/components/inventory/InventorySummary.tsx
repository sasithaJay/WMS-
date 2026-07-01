import { Package, AlertTriangle, CheckCircle } from "lucide-react";
import { StatCard } from "../common/StatCard";
import { INVENTORY_ITEMS } from "../../constants/mockData";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";

export function InventorySummary({ lang }: { lang: Lang }) {
  const total = INVENTORY_ITEMS.length;
  const low = INVENTORY_ITEMS.filter((i) => i.qty <= i.reorder).length;
  const normal = total - low;
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard label={t(lang, "Total Items", "මුළු භාණ්ඩ")} value={total} color="blue" icon={<Package className="w-5 h-5" />} />
      <StatCard label={t(lang, "Low / Critical Stock", "අඩු / බරපතල")} value={low} color="red" icon={<AlertTriangle className="w-5 h-5" />} />
      <StatCard label={t(lang, "Normal Stock", "සාමාන්‍ය")} value={normal} color="green" icon={<CheckCircle className="w-5 h-5" />} />
    </div>
  );
}
