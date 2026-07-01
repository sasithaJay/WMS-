import { useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { APPROVE_QUEUE } from "../../constants/mockData";
import { t } from "../../constants/translations";
import { EmptyState } from "../common/EmptyState";
import type { Lang } from "../../types";

export function ApprovalQueue({ lang }: { lang: Lang }) {
  const [approved, setApproved] = useState<string[]>([]);
  const [qtys, setQtys] = useState<Record<string, Record<string, number>>>(() => {
    const init: Record<string, Record<string, number>> = {};
    APPROVE_QUEUE.forEach((r) => {
      init[r.ref] = {};
      r.items.forEach((it) => { init[r.ref][it.name] = it.requested; });
    });
    return init;
  });

  const visible = APPROVE_QUEUE.filter((r) => !approved.includes(r.ref));

  if (visible.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle className="w-9 h-9 text-green-400" />}
        title={t(lang, "No pending approvals", "අනුමත ඉල්ලීම් නැත")}
        subtitle={t(lang, "All requests have been processed.", "සියලු ඉල්ලීම් සකස් කර ඇත.")}
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        {visible.length} {t(lang, "request(s) awaiting your approval", "ඉල්ලීම් ඔබගේ අනුමතිය බලා සිටී")}
      </p>
      {visible.map((r) => (
        <div key={r.ref} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="font-mono text-xs font-bold text-gray-600">{r.ref}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
              {t(lang, "Pending Approval", "අනුමත අපේක්ෂිත")}
            </span>
            <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${r.division === "SS" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"}`}>
              {r.division}
            </span>
          </div>
          <div className="text-sm font-semibold text-gray-900">{r.requester}</div>
          <div className="text-xs text-gray-400 mb-4">{r.section} · {r.date}</div>

          <div className="border border-gray-100 rounded-xl overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-2 text-xs font-semibold text-gray-500">{t(lang, "Item", "භාණ්ඩය")}</th>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-500 text-center">{t(lang, "Requested", "ඉල්ලූ")}</th>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-500 text-center">{t(lang, "Approve Qty", "අනුමත ප්‍රමාණය")}</th>
                  <th className="px-4 py-2 text-xs font-semibold text-gray-500">{t(lang, "Unit", "ඒකකය")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {r.items.map((it) => (
                  <tr key={it.name}>
                    <td className="px-4 py-2.5 text-gray-800 font-medium text-sm">{it.name}</td>
                    <td className="px-4 py-2.5 text-center text-gray-500 text-sm">{it.requested}</td>
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="number" min={0} max={it.requested}
                        value={qtys[r.ref]?.[it.name] ?? it.requested}
                        onChange={(e) =>
                          setQtys((q) => ({ ...q, [r.ref]: { ...q[r.ref], [it.name]: parseInt(e.target.value) || 0 } }))
                        }
                        className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{it.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-xs text-amber-700 mb-4 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {t(lang, "You may reduce quantities before approving.", "අනුමත කිරීමට පෙර ප්‍රමාණ අඩු කළ හැකිය.")}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setApproved((a) => [...a, r.ref])}
              className="flex-1 py-2 border-2 border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-50 transition-all"
            >
              {t(lang, "Reject", "ප්‍රතික්ෂේප")}
            </button>
            <button
              onClick={() => setApproved((a) => [...a, r.ref])}
              className="flex-1 py-2 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all"
            >
              {t(lang, "Approve", "අනුමත")}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
