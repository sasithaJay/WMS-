import React, { useEffect, useState, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { t } from "../../constants/translations";
import type { Lang, Role, DashTab } from "../../types";
import { getNavBadgeCounts } from "../../../services/badgeCountService";
import { getCurrentUser } from "../../../services/authService";
import type { User } from "../../types/auth";
import { BadgeRefreshContext } from "../../context/BadgeRefreshContext";
import { Sparkles } from "lucide-react";

const NAV_TITLES: Record<string, { en: string; si: string }> = {
  dashboard: { en: "Dashboard", si: "උපකරණ පුවරුව" },
  requests: { en: "My Requests", si: "මගේ ඉල්ලීම්" },
  new: { en: "New Request", si: "නව ඉල්ලීම" },
  recommend: { en: "Recommend Queue", si: "නිර්දේශ පෝලිම" },
  approve: { en: "Approve Queue", si: "අනුමත පෝලිම" },
  issue: { en: "Issue Goods", si: "භාණ්ඩ ගිලිහීම" },
  "equipment-returns": { en: "Equipment Returns", si: "උපකරණ ආපසු ලබාගැනීම" },
  inventory: { en: "Inventory", si: "තොග ලැයිස්තුව" },
  receipts: { en: "Stock Receipts", si: "ගබඩා රිසිට්" },
  reports: { en: "Reports", si: "වාර්තා" },
  users: { en: "User Management", si: "පරිශීලක කළමනාකරණය" },
  commissioners: { en: "Commissioner Accounts", si: "කොමසාරිස් ගිණුම්" },
  settings: { en: "Settings", si: "සැකසීම්" },
};

function getDisplayName(user: User | null): string {
  if (!user) return "";
  return user.staff_profile?.full_name ?? user.organization?.name ?? user.username;
}

function getDisplayRole(user: User | null, lang: Lang): string {
  if (!user) return "";
  if (user.staff_profile?.role) {
    return t(lang, user.staff_profile.role.name_en, user.staff_profile.role.name_si);
  }
  if (user.organization) {
    return user.organization.organization_kind === "INSTITUTION"
      ? t(lang, "Institution", "ආයතනය")
      : t(lang, "DS Office", "ප්‍රාදේශීය ලේකම් කාර්යාලය");
  }
  return user.account_type;
}

export function DashboardLayout({
  lang,
  setLang,
  role,
  activeNav,
  setActiveNav,
  onLogout,
  canSeeSummary,
  dashTab,
  setDashTab,
  children,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  role: Role;
  activeNav: string;
  setActiveNav: (id: string) => void;
  onLogout: () => void;
  canSeeSummary?: boolean;
  dashTab?: DashTab;
  setDashTab?: (tab: DashTab) => void;
  children: React.ReactNode;
}) {
  // On mobile (<768px), sidebar is hidden by default (`collapsed = true`)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return typeof window !== "undefined" ? window.innerWidth < 768 : false;
  });

  const [badges, setBadges] = useState<Record<string, number>>({});
  const [badgeRefreshSignal, setBadgeRefreshSignal] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const titleEntry = NAV_TITLES[activeNav] ?? { en: "Dashboard", si: "උපකරණ පුවරුව" };
  const title = t(lang, titleEntry.en, titleEntry.si);

  const userName = getDisplayName(currentUser);
  const roleLabel = getDisplayRole(currentUser, lang);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t(lang, "Good morning", "සුභ උදෑසනක්");
    if (h < 17) return t(lang, "Good afternoon", "සුභ දහවලක්");
    return t(lang, "Good evening", "සුභ සැන්දෑවක්");
  };

  useEffect(() => {
    let mounted = true;
    const refreshCurrentUser = () => {
      getCurrentUser()
        .then((user) => {
          if (mounted) setCurrentUser(user);
        })
        .catch((err) => console.error(err));
    };

    window.addEventListener("wms-profile-updated", refreshCurrentUser);
    refreshCurrentUser();

    return () => {
      mounted = false;
      window.removeEventListener("wms-profile-updated", refreshCurrentUser);
    };
  }, []);

  const loadBadges = useCallback(async () => {
    const counts = await getNavBadgeCounts();
    setBadges(counts);
  }, []);

  useEffect(() => {
    loadBadges();
  }, [loadBadges]);

  useEffect(() => {
    if (badgeRefreshSignal > 0) {
      loadBadges();
    }
  }, [badgeRefreshSignal, loadBadges]);

  useEffect(() => {
    loadBadges();
  }, [activeNav]);

  const triggerBadgeRefresh = useCallback(() => {
    setBadgeRefreshSignal((s) => s + 1);
  }, []);

  return (
    <BadgeRefreshContext.Provider value={{ triggerBadgeRefresh }}>
      <div className="h-dvh overflow-hidden bg-[var(--app-shell)] p-0 text-[var(--text-primary)] antialiased sm:p-3">
       <div className="flex h-full overflow-hidden bg-[var(--app-shell)] sm:rounded-[28px] sm:border sm:border-white/70 sm:shadow-[0_2px_12px_rgba(15,23,42,0.05)]">
        {/* RESPONSIVE SIDEBAR */}
        <Sidebar
          lang={lang}
          setLang={setLang}
          role={role}
          active={activeNav}
          setActive={setActiveNav}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed((c) => !c)}
          onLogout={onLogout}
          badges={badges}
        />

        {/* MAIN CONTAINER */}
        <div className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden bg-[var(--app-shell)]">
          {/* TOPBAR WITH MOBILE HAMBURGER TOGGLE */}
          <Topbar
            lang={lang}
            setLang={setLang}
            title={title}
            onMobileMenuToggle={() => setSidebarCollapsed((c) => !c)}
          />

          <main className="custom-scrollbar flex-1 overflow-y-auto rounded-tl-3xl bg-[var(--page-background)] p-4 sm:p-6 lg:p-8">
            {activeNav === "dashboard" && (
              <div className="mb-6 rounded-2xl border border-blue-700/40 bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-700 p-5 text-white shadow-[0_2px_8px_rgba(15,23,42,0.12)] md:border-slate-700 md:from-slate-600 md:via-slate-700 md:to-slate-600 sm:p-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div>
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium text-slate-200">
                      <Sparkles className="h-3.5 w-3.5 text-sky-300" />
                      <span>{greeting()}</span>
                    </div>

                    <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
                      {userName || "\u00A0"}
                    </h2>

                    <p className="mt-1 text-xs font-medium text-slate-300">
                      {roleLabel}
                    </p>
                  </div>

                  {canSeeSummary && dashTab !== undefined && setDashTab && (
                    <div className="flex self-start rounded-xl border border-white/20 bg-white/10 p-1 md:self-auto">
                      {(["personal", "summary"] as DashTab[]).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setDashTab(tab)}
                          className={`cursor-pointer rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all sm:px-4 sm:py-2 ${
                            dashTab === tab
                              ? "bg-white text-slate-800 shadow-sm"
                              : "text-slate-200 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          {tab === "personal"
                            ? t(lang, "My View", "මගේ දසුන")
                            : t(lang, "Overview", "දළ විශ්ලේෂණය")}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {children}
          </main>
        </div>
       </div>
      </div>
    </BadgeRefreshContext.Provider>
  );
}
