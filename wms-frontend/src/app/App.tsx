
import { useEffect, useState } from "react";
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
import { GenericStaffDashboard } from "./pages/dashboards/GenericStaffDashboard";
import { OfficerDashboard } from "./pages/dashboards/OfficerDashboard";
import { InstitutionDashboard } from "./pages/dashboards/InstitutionDashboard";
import { DivisionalSecretariatDashboard } from "./pages/dashboards/DivisionalSecretariatDashboard";

import type { Screen, Role } from "./types";
import { getCurrentUser } from "../services/authService";
import type { User } from "./types/auth";

export default function App() {
  const { lang, setLang } = useLanguage();

  const [screen, setScreen] = useState<Screen>("login");
  const [role, setRole] = useState<Role>("COMMISSIONER");
  const [loading, setLoading] = useState(true);

  /*
   * Restore authentication after page refresh
   */
  useEffect(() => {
    const token =
      localStorage.getItem("auth_token") ??
      sessionStorage.getItem("auth_token");

    // No token -> show login
    if (!token) {
      setLoading(false);
      return;
    }

    // Token exists -> verify it with Laravel
    getCurrentUser()
      .then((user: User) => {
        const userRole = getUserRole(user);

        setRole(userRole);
        setScreen("dashboard");
      })
      .catch((error) => {
        console.error("Failed to restore authentication:", error);

        // Invalid / expired token
        localStorage.removeItem("auth_token");
        localStorage.removeItem("auth_user");

        sessionStorage.removeItem("auth_token");
        sessionStorage.removeItem("auth_user");

        setScreen("login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  /*
   * Convert backend user data into frontend Role
   */
  const getUserRole = (user: User): Role => {
    if (user.account_type === "INSTITUTION") {
      return "INSTITUTION";
    }

    if (user.staff_profile?.role) {
      const backendRole = user.staff_profile.role.code;

      if (backendRole === "OTHER_OFFICER") {
        return "DEVELOPMENT_OFFICER";
      }

      return backendRole as Role;
    }

    return "DEVELOPMENT_OFFICER";
  };

  /*
   * Called after successful login
   */
  const login = (r: Role) => {
    setRole(r);
    setScreen("dashboard");
  };

  /*
   * Logout
   */
  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");

    sessionStorage.removeItem("auth_token");
    sessionStorage.removeItem("auth_user");

    setScreen("login");
  };

  /*
   * Prevent login page from flashing while checking token
   */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-4 border-[#4295D9]/20 border-t-[#4295D9] animate-spin" />

          <p className="text-sm text-gray-500">
            Loading...
          </p>
        </div>
      </div>
    );
  }

  /*
   * Login
   */
  if (screen === "login") {
    return (
      <LoginPage
        lang={lang}
        setLang={setLang}
        onLogin={login}
        onRegister={() => setScreen("register")}
      />
    );
  }

  /*
   * Registration
   */
  if (screen === "register") {
    return (
      <RegisterPage
        lang={lang}
        setLang={setLang}
        onBack={() => setScreen("login")}
      />
    );
  }

  /*
   * Dashboard props
   */
  const dashProps = {
    lang,
    setLang,
    onLogout: logout,
  };

  /*
   * Role-based dashboard
   */
  switch (role) {
    case "ADMIN":
      return <AdminDashboard {...dashProps} />;

    case "COMMISSIONER":
      return <CommissionerDashboard {...dashProps} />;

    case "ASSISTANT_COMMISSIONER":
      return <AssistantCommissionerDashboard {...dashProps} />;

    case "ASSISTANT_DIRECTOR":
      return <AssistantDirectorDashboard {...dashProps} />;

    case "ACCOUNTANT":
      return <AccountantDashboard {...dashProps} />;

    case "ADMINISTRATIVE_OFFICER":
      return <AdministrativeOfficerDashboard {...dashProps} />;

    case "SECTION_HEAD":
      return <SectionHeadDashboard {...dashProps} />;

    case "STORE_KEEPER":
      return <StoreKeeperDashboard {...dashProps} />;

    case "DEVELOPMENT_OFFICER":
    case "MSO":
    case "OA":
    case "DRIVER":
    case "SSO":
    case "HQSSO":
    case "SPO":
      return (
        <GenericStaffDashboard
          {...dashProps}
          role={role}
        />
      );

    case "OFFICER":
      return <OfficerDashboard {...dashProps} />;

    case "INSTITUTION":
      return <InstitutionDashboard {...dashProps} />;

    case "DIVISIONAL_SECRETARIAT":
      return (
        <DivisionalSecretariatDashboard
          {...dashProps}
        />
      );

    default:
      return <CommissionerDashboard {...dashProps} />;
  }
}

