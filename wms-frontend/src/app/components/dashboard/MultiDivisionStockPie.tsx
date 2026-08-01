

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { DivisionDashboardSummary } from "../../types/dashboard";

const STATUS_COLORS = { normal: "#10B981", low: "#F59E0B", out: "#EF4444" };

function toSlices(breakdown: { normal: number; low: number; out: number }, lang: Lang) {
  return [
    { key: "normal", name: t(lang, "Normal", "සාමාන්‍ය"), value: breakdown.normal },
    { key: "low", name: t(lang, "Low Stock", "අඩු තොග"), value: breakdown.low },
    { key: "out", name: t(lang, "Out of Stock", "තොග නොමැත"), value: breakdown.out },
  ].filter((s) => s.value > 0);
}

export function MultiDivisionStockPie({ lang, divisions }: { lang: Lang; divisions: DivisionDashboardSummary[] }) {
  const [divA, divB] = divisions;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-900 text-sm mb-1">
        {t(lang, "Stock Status — Both Stores", "තොග තත්ත්වය — ගබඩා දෙකම")}
      </h3>
      <p className="text-xs text-gray-400 mb-3">
        {t(lang, "Inner ring", "අභ්‍යන්තර වළල්ල")}: {t(lang, divA.division_name_en, divA.division_name_si)} ·{" "}
        {t(lang, "Outer ring", "බාහිර වළල්ල")}: {t(lang, divB.division_name_en, divB.division_name_si)}
      </p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={toSlices(divA.stock_status, lang)} dataKey="value" nameKey="name" innerRadius={35} outerRadius={60} paddingAngle={2}>
            {toSlices(divA.stock_status, lang).map((s) => (
              <Cell key={s.key} fill={STATUS_COLORS[s.key as keyof typeof STATUS_COLORS]} />
            ))}
          </Pie>
          <Pie data={toSlices(divB.stock_status, lang)} dataKey="value" nameKey="name" innerRadius={70} outerRadius={95} paddingAngle={2}>
            {toSlices(divB.stock_status, lang).map((s) => (
              <Cell key={s.key} fill={STATUS_COLORS[s.key as keyof typeof STATUS_COLORS]} fillOpacity={0.7} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E2E8F0", fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-2 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.normal }} />{t(lang, "Normal", "සාමාන්‍ය")}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.low }} />{t(lang, "Low", "අඩු")}</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS.out }} />{t(lang, "Out", "නොමැත")}</span>
      </div>
    </div>
  );
}