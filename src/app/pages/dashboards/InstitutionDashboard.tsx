import { useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { MonthlyRequestStatus } from "../../components/requests/MonthlyRequestStatus";
import { MyRequestsTable } from "../../components/requests/MyRequestsTable";
import { RequestForm } from "../../components/requests/RequestForm";
import { SettingsScreen } from "../../components/settings/SettingsScreen";
import { t } from "../../constants/translations";
import { ShieldCheck } from "lucide-react";
import type { Lang } from "../../types";

export function InstitutionDashboard({ lang, setLang, onLogout }: { lang: Lang; setLang: (l: Lang) => void; onLogout: () => void }) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const role = "INSTITUTION" as const;

  return (
    <DashboardLayout lang={lang} setLang={setLang} role={role} activeNav={activeNav} setActiveNav={setActiveNav} onLogout={onLogout}>
      {activeNav === "dashboard" && (
        <div className="space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            {t(lang, "Your requests must be recommended by the Administrative Officer before approval.", "ඔබගේ ඉල්ලීම් අනුමත කිරීමට පෙර ව්‍යවස්ථාපිත නිලධාරී (AO) විසින් නිර්දේශ කළ යුතුය.")}
          </div>
          <MonthlyRequestStatus lang={lang} onNewRequest={() => setActiveNav("new")} />
        </div>
      )}
      {activeNav === "requests" && <MyRequestsTable lang={lang} role={role} />}
      {activeNav === "new" && <RequestForm lang={lang} role={role} onCancel={() => setActiveNav("requests")} />}
      {activeNav === "settings" && <SettingsScreen lang={lang} role={role} />}
    </DashboardLayout>
  );
}
