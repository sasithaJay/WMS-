import { useState } from "react";
import { useLanguage } from "./hooks/useLanguage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { AdminDashboard } from "./pages/dashboards/AdminDashboard";
import { CommissionerDashboard } from "./pages/dashboards/CommissionerDashboard";
import { AssistantCommissionerDashboard } from "./pages/dashboards/AssistantCommissionerDashboard";
import { AssistantDirectorDashboard } from "./pages/dashboards/AssistantDirectorDashboard";
import { AccountantDashboard } from "./pages/dashboards/AccountantDashboard";
import { AdministrativeOfficerDashboard } from "./pages/dashboards/AdministrativeOfficerDashboard";
import { SectionHeadDashboard } from "./pages/dashboards/SectionHeadDashboard";
import { StoreKeeperDashboard } from "./pages/dashboards/StoreKeeperDashboard";
import { DevelopmentOfficerDashboard } from "./pages/dashboards/DevelopmentOfficerDashboard";
import { OfficerDashboard } from "./pages/dashboards/OfficerDashboard";
import { InstitutionDashboard } from "./pages/dashboards/InstitutionDashboard";
import { DivisionalSecretariatDashboard } from "./pages/dashboards/DivisionalSecretariatDashboard";
import type { Screen, Role } from "./types";

export default function App() {
  const { lang, setLang } = useLanguage();
  const [screen, setScreen] = useState<Screen>("login");
  const [role, setRole] = useState<Role>("COMMISSIONER");

  const login = (r: Role) => { setRole(r); setScreen("dashboard"); };
  const logout = () => setScreen("login");

  if (screen === "login") {
    return <LoginPage lang={lang} setLang={setLang} onLogin={login} onRegister={() => setScreen("register")} />;
  }
  if (screen === "register") {
    return <RegisterPage lang={lang} setLang={setLang} onBack={() => setScreen("login")} />;
  }

  const dashProps = { lang, setLang, onLogout: logout };

  switch (role) {
    case "ADMIN": return <AdminDashboard {...dashProps} />;
    case "COMMISSIONER": return <CommissionerDashboard {...dashProps} />;
    case "ASSISTANT_COMMISSIONER": return <AssistantCommissionerDashboard {...dashProps} />;
    case "ASSISTANT_DIRECTOR": return <AssistantDirectorDashboard {...dashProps} />;
    case "ACCOUNTANT": return <AccountantDashboard {...dashProps} />;
    case "ADMINISTRATIVE_OFFICER": return <AdministrativeOfficerDashboard {...dashProps} />;
    case "SECTION_HEAD": return <SectionHeadDashboard {...dashProps} />;
    case "STORE_KEEPER": return <StoreKeeperDashboard {...dashProps} />;
    case "DEVELOPMENT_OFFICER": return <DevelopmentOfficerDashboard {...dashProps} />;
    case "OFFICER": return <OfficerDashboard {...dashProps} />;
    case "INSTITUTION": return <InstitutionDashboard {...dashProps} />;
    case "DIVISIONAL_SECRETARIAT": return <DivisionalSecretariatDashboard {...dashProps} />;
    default: return <CommissionerDashboard {...dashProps} />;
  }
}

