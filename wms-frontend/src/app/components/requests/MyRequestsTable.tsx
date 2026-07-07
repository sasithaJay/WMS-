import { useState } from "react";
import { PlusCircle, Package, ArrowRight, AlertCircle } from "lucide-react";
import { ALL_REQUESTS } from "../../constants/mockData";
import { STATUS_CONFIG, t } from "../../constants/translations";
import type { Lang, Role, StatusType } from "../../types";

function ItemChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center text-[11px] font-medium px-2.5 py-0.5 rounded-full border bg-[#EBF4FD] text-[#4295D9] border-blue-100">
      {label}
    </span>
  );
}

export function MyRequestsTable({ lang, role, onNewRequest }: { lang: Lang; role: Role; onNewRequest?: () => void }) {
  const [tab, setTab] = useState<"personal" | "section">("personal");
  const isFA = role === "SECTION_HEAD";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {(isFA ? ["personal", "section"] : ["personal"]).map((tb) => (
            <button
              key={tb}
              onClick={() => setTab(tb as "personal" | "section")}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                tab === tb ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              {tb === "personal" ? t(lang, "Personal", "පෞද්ගලික") : t(lang, "Section (Common Use)", "අංශ (පොදු)")}
            </button>
          ))}
        </div>
        {onNewRequest && (
          <button
            onClick={onNewRequest}
            className="flex items-center gap-2 px-4 py-2 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            {t(lang, "New Request", "නව ඉල්ලීම")}
          </button>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-700 flex items-center gap-2">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        {t(lang, "You may submit one personal request per month.", "ඔබට මසකට පෞද්ගලික ඉල්ලීමක් ඉදිරිපත් කළ හැකිය.")}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {[
                t(lang, "Date", "දිනය"),
                t(lang, "Reference No.", "යොමු අංකය"),
                t(lang, "Section / Office", "අංශය / කාර්යාලය"),
                t(lang, "Items", "භාණ්ඩ"),
                t(lang, "Status", "තත්ත්වය"),
              ].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ALL_REQUESTS.map((r) => {
              const statusKey: StatusType =
                role === "COMMISSIONER"
                  ? r.status === "pending" || r.status === "approved"
                    ? "pending_issue"
                    : r.status === "rejected"
                      ? "cancelled"
                      : r.status
                  : r.status;

              const sc = STATUS_CONFIG[statusKey];
              return (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-500 text-xs whitespace-nowrap">{r.date}</td>
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-gray-700">{r.ref}</td>
                  <td className="px-5 py-3.5 text-gray-600 text-xs">{r.section}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {r.items.map((item) => <ItemChip key={item} label={item} />)}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${sc.color}`}>
                      {t(lang, sc.label, sc.labelSi)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
