

import { useState } from "react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { MonthlyRequestStatus } from "../../components/requests/MonthlyRequestStatus";
import { MyRequestsTable } from "../../components/requests/MyRequestsTable";
import { RequestForm } from "../../components/requests/RequestForm";
import { SettingsScreen } from "../../components/settings/SettingsScreen";
import type { Lang, Role } from "../../types";

export function GenericStaffDashboard({
  lang,
  setLang,
  onLogout,
  role,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  onLogout: () => void;
  role: Role;
}) {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [requestsRefreshSignal, setRequestsRefreshSignal] = useState(0);

  return (
    <DashboardLayout lang={lang} setLang={setLang} role={role} activeNav={activeNav}
      setActiveNav={(id) => setActiveNav(id)}
      onLogout={onLogout}>
      {activeNav === "dashboard" && (
        <MonthlyRequestStatus
          lang={lang}
          role={role}
          onNewRequest={() => setActiveNav("new")}
          onViewAll={() => setActiveNav("requests")}
        />
      )}
      {activeNav === "requests" && <MyRequestsTable lang={lang} role={role} refreshSignal={requestsRefreshSignal} />}
      {activeNav === "new" && <RequestForm lang={lang} role={role} onCancel={() => setActiveNav("requests")}
        onSubmitted={() => {
          setRequestsRefreshSignal((s) => s + 1);
          setActiveNav("requests");
        }} />}
      {activeNav === "settings" && <SettingsScreen lang={lang} role={role} />}
    </DashboardLayout>
  );
}