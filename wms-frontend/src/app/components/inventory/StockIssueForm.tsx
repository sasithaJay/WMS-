import { useState } from "react";
import { Package } from "lucide-react";
import { ISSUE_QUEUE } from "../../constants/mockData";
import { t } from "../../constants/translations";
import { EmptyState } from "../common/EmptyState";
import type { Lang } from "../../types";

function ItemChip({ label, color = "blue" }: { label: string; color?: string }) {
  return (
    <span className={`inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
      color === "green" ? "bg-green-50 text-green-700 border-green-200" : "bg-[#EBF4FD] text-[#4295D9] border-blue-100"
    }`}>
      {label}
    </span>
  );
}

export function StockIssueForm({ lang }: { lang: Lang }) {
  const [issued, setIssued] = useState<string[]>([]);
  const visible = ISSUE_QUEUE.filter((r) => !issued.includes(r.ref));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {visible.length} {t(lang, "approved request(s) ready to issue", "අනුමත ඉල්ලීම් ගිලිහීමට සූදානම්")}
        </p>
      </div>

      {visible.length === 0 && (
        <EmptyState
          icon={<Package className="w-9 h-9 text-green-400" />}
          title={t(lang, "All goods issued", "සියලු භාණ්ඩ ගිලිහී ඇත")}
          subtitle={t(lang, "No approved requests pending issuance.", "ගිලිහීමට ඉල්ලීම් නොමැත.")}
        />
      )}

      {visible.length > 0 && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {visible.map((r) => (
            <div key={r.ref} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-mono text-xs font-bold text-gray-600">{r.ref}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-semibold">{t(lang, "Approved", "අනුමත")}</span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${r.division === "SS" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>{r.division}</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">{r.requester}</div>
                  <div className="text-xs text-gray-400 mb-3">{r.role} · {t(lang, "Approved", "අනුමත")}: {r.approvalDate}</div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.items.map((item) => <ItemChip key={item} label={item} color="green" />)}
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setIssued((is) => [...is, r.ref])}
                  className="flex items-center gap-2 px-5 py-2 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all"
                >
                  <Package className="w-4 h-4" />
                  {t(lang, "Mark as Issued", "ගිලිහූ ලෙස සලකුණු කරන්න")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
