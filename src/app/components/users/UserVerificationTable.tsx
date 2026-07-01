import { useState } from "react";
import { UserCheck, UserX } from "lucide-react";
import { PENDING_USERS } from "../../constants/mockData";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";

export function UserVerificationTable({ lang }: { lang: Lang }) {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const pendingVisible = PENDING_USERS.filter((u) => !dismissed.includes(u.username));

  return (
    <div>
      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
        {t(lang, "Pending Verification", "සත්‍යාපනය බලා සිටී")}
        {pendingVisible.length > 0 && (
          <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{pendingVisible.length}</span>
        )}
      </h3>
      {pendingVisible.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
          <UserCheck className="w-8 h-8 mx-auto mb-2 text-green-300" />
          {t(lang, "No pending verifications.", "සත්‍යාපනය අපේක්ෂිත නැත.")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {pendingVisible.map((u) => (
            <div key={u.username} className="bg-white rounded-xl border border-amber-100 p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center font-bold text-amber-600 text-sm flex-shrink-0">{u.name[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 text-sm">{u.name}</div>
                <div className="text-xs text-gray-500">{u.role} · {u.division}</div>
                <div className="text-xs font-mono text-gray-400 mt-0.5">@{u.username}</div>
              </div>
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <button onClick={() => setDismissed((d) => [...d, u.username])} className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 transition-all">
                  <UserCheck className="w-3 h-3" />{t(lang, "Activate", "සක්‍රිය")}
                </button>
                <button onClick={() => setDismissed((d) => [...d, u.username])} className="flex items-center gap-1 px-3 py-1.5 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-50 transition-all">
                  <UserX className="w-3 h-3" />{t(lang, "Reject", "ප්‍රතික්ෂේප")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
