import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { StockStatusBreakdown } from "../../types/dashboard";

interface StockStatusPieChartProps {
  lang: Lang;
  breakdown: StockStatusBreakdown;
  title?: string;
}

const COLORS = { normal: "#10B981", low: "#F59E0B", out: "#EF4444" };

export function StockStatusPieChart({ lang, breakdown, title }: StockStatusPieChartProps) {
  const data = [
    { key: "normal", name: t(lang, "Normal", "සාමාන්‍ය"), value: breakdown.normal },
    { key: "low", name: t(lang, "Low Stock", "අඩු තොග"), value: breakdown.low },
    { key: "out", name: t(lang, "Out of Stock", "තොග නොමැත"), value: breakdown.out },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-center h-[248px]">
        <p className="text-sm text-gray-400">{t(lang, "No item data available.", "භාණ්ඩ දත්ත නොමැත.")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-4">
        {title ?? t(lang, "Stock Status Breakdown", "තොග තත්ත්ව බෙදීම")}
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
            {data.map((entry) => (
              <Cell key={entry.key} fill={COLORS[entry.key as keyof typeof COLORS]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}