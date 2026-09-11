import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { StockStatusBreakdown } from "../../types/dashboard";

interface StockStatusPieChartProps {
  lang: Lang;
  breakdown: StockStatusBreakdown;
  title?: string;
}

const COLORS = { 
  normal: "#10B981", // Emerald 500
  low: "#F59E0B",    // Amber 500
  out: "#F43F5E"     // Rose 500
};

export function StockStatusPieChart({ lang, breakdown, title }: StockStatusPieChartProps) {
  const data = [
    { key: "normal", name: t(lang, "Normal", "සාමාන්‍ය"), value: breakdown.normal },
    { key: "low", name: t(lang, "Low Stock", "අඩු තොග"), value: breakdown.low },
    { key: "out", name: t(lang, "Out of Stock", "තොග නොමැත"), value: breakdown.out },
  ].filter((d) => d.value > 0);

  const totalItems = breakdown.normal + breakdown.low + breakdown.out;

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col items-center justify-center h-[280px] shadow-xs">
        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-2">
          <PieChartIcon className="w-5 h-5" />
        </div>
        <p className="text-xs font-medium text-slate-500">
          {t(lang, "No item data available.", "භාණ්ඩ දත්ත නොමැත.")}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-slate-900 text-sm tracking-tight">
          {title ?? t(lang, "Stock Status Breakdown", "තොග තත්ත්ව බෙදීම")}
        </h3>
        <span className="text-xs font-semibold text-slate-400">
          {totalItems} {t(lang, "Total", "එකතුව")}
        </span>
      </div>

      {/* Chart */}
      <div className="relative h-[210px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={75}
              paddingAngle={4}
              cornerRadius={6}
            >
              {data.map((entry) => (
                <Cell 
                  key={entry.key} 
                  fill={COLORS[entry.key as keyof typeof COLORS]} 
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(4px)",
                borderRadius: "12px",
                border: "1px solid rgba(226, 232, 240, 0.8)",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                fontSize: "12px",
                fontWeight: "600",
                color: "#0F172A",
                padding: "8px 12px"
              }}
              itemStyle={{ color: "#0F172A" }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                fontSize: "11px",
                fontWeight: "600",
                color: "#64748B",
                paddingTop: "8px"
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Total Counter Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-7">
          <span className="text-lg font-extrabold text-slate-900 leading-none">
            {totalItems}
          </span>
          <span className="text-[10px] font-semibold text-slate-400 mt-0.5">
            {t(lang, "Items", "අයිතම")}
          </span>
        </div>
      </div>
    </div>
  );
}