import { useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { MonthlyRequestStatus } from "../../components/requests/MonthlyRequestStatus";
import { MyRequestsTable } from "../../components/requests/MyRequestsTable";
import { RequestForm } from "../../components/requests/RequestForm";
import { SettingsScreen } from "../../components/settings/SettingsScreen";
import type { Lang } from "../../types";

export function OfficerDashboard({ lang, setLang, onLogout }: { lang: Lang; setLang: (l: Lang) => void; onLogout: () => void }) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const role = "OFFICER" as const;

  return (
    <DashboardLayout lang={lang} setLang={setLang} role={role} activeNav={activeNav} setActiveNav={setActiveNav} onLogout={onLogout}>
      {activeNav === "dashboard" && <MonthlyRequestStatus lang={lang} onNewRequest={() => setActiveNav("new")} />}
      {activeNav === "requests" && <MyRequestsTable lang={lang} role={role} />}
      {activeNav === "new" && <RequestForm lang={lang} role={role} onCancel={() => setActiveNav("requests")} />}
      {activeNav === "settings" && <SettingsScreen lang={lang} role={role} />}
    </DashboardLayout>
  );
}
