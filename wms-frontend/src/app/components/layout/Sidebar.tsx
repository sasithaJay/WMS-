import { useEffect, useState } from "react";
import {
  Menu,
  X,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { NAV_ITEMS } from "../../constants/menuItems";
import { t } from "../../constants/translations";
import type { Lang, Role } from "../../types";
import { User } from "../../types/auth";
import { getCurrentUser } from "../../../services/authService";
import logo from "../../resources/logo.jpeg";

function getDisplayName(user: User | null): string {
  if (!user) return "";
  return (
    user.staff_profile?.full_name ??
    user.organization?.name ??
    user.username
  );
}

function getDisplayRole(user: User | null, lang: Lang): string {
  if (!user) return "";

  if (user.staff_profile?.role) {
    return t(
      lang,
      user.staff_profile.role.name_en,
      user.staff_profile.role.name_si
    );
  }

  if (user.organization) {
    return user.organization.organization_kind === "INSTITUTION"
      ? t(lang, "Institution", "ආයතනය")
      : t(
          lang,
          "DS Office",
          "ප්‍රාදේශීය ලේකම් කාර්යාලය"
        );
  }

  return user.account_type;
}

export function Sidebar({
  lang,
  setLang,
  role,
  active,
  setActive,
  collapsed,
  onToggle,
  onLogout,
  badges = {},
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  role: Role;
  active: string;
  setActive: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
  badges?: Record<string, number>;
}) {
  const nav = NAV_ITEMS[role] ?? [];
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const userName = getDisplayName(currentUser);
  const roleLabel = getDisplayRole(currentUser, lang);

  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch((err) => console.error(err));
  }, []);

  const initials = userName
    ? userName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((name) => name[0])
        .join("")
        .toUpperCase()
    : "U";

  const handleNavClick = (id: string) => {
    setActive(id);
    // Auto-collapse sidebar on mobile screens when an item is selected
    if (window.innerWidth < 768 && !collapsed) {
      onToggle();
    }
  };

  return (
    <>
      {/* MOBILE BACKDROP OVERLAY */}
      {!collapsed && (
        <div
          onClick={onToggle}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
        />
      )}

      {/* SIDEBAR CONTAINER */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0
          h-screen
          flex
          flex-col
          bg-slate-900
          border-r border-slate-800/80
          shadow-2xl
          transition-all
          duration-300
          ease-in-out
          flex-shrink-0
          z-50
          ${
            collapsed
              ? "-translate-x-full md:translate-x-0 md:w-[76px]"
              : "translate-x-0 w-[260px]"
          }
        `}
      >
        {/* HEADER / BRANDING */}
        <div
          className={`
            h-20
            flex
            items-center
            border-b border-slate-800/80
            flex-shrink-0
            px-4
            ${collapsed ? "justify-center" : "justify-between"}
          `}
        >
          {!collapsed ? (
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-slate-900 ring-1 ring-slate-800 shadow-lg p-0.5">
                <img
                  src={logo}
                  alt="WMS Logo"
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              <div className="min-w-0">
                <div className="text-sm font-bold text-white tracking-tight leading-tight flex items-center gap-1.5">
                  <span>WMS</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                </div>
                <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
                  Social Welfare & Probation
                </p>
              </div>
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 ring-1 ring-slate-800 shadow-lg p-0.5">
              <img
                src={logo}
                alt="WMS Logo"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}

          <button
            type="button"
            onClick={onToggle}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`
              w-8 h-8 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800
              text-slate-400 hover:text-white transition-all flex items-center justify-center shrink-0 cursor-pointer
              ${collapsed ? "hidden" : "ml-2"}
            `}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* TOGGLE BUTTON FOR DESKTOP COLLAPSED STATE */}
        {collapsed && (
          <div className="hidden md:flex justify-center py-2 border-b border-slate-800/80">
            <button
              type="button"
              onClick={onToggle}
              title="Expand sidebar"
              className="w-8 h-8 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center cursor-pointer"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* NAVIGATION ITEMS */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1.5 custom-scrollbar">
          {!collapsed && (
            <div className="px-3 pt-2 pb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Navigation
              </span>
            </div>
          )}

          {nav.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            const badgeValue = badges[item.id];

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                title={
                  collapsed
                    ? t(lang, item.label, item.labelSi)
                    : undefined
                }
                className={`
                  group relative w-full flex items-center rounded-xl transition-all duration-200 cursor-pointer text-xs font-semibold
                  ${collapsed ? "justify-center px-2 py-3" : "gap-3 px-3.5 py-3"}
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 ring-1 ring-blue-500/50"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/80"
                  }
                `}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"
                  }`}
                />

                {!collapsed && (
                  <span className="flex-1 text-left truncate">
                    {t(lang, item.label, item.labelSi)}
                  </span>
                )}

                {/* BADGES */}
                {badgeValue !== undefined && badgeValue > 0 && (
                  <span
                    className={`
                      flex items-center justify-center font-bold shrink-0 rounded-full
                      ${
                        collapsed
                          ? "absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-[9px] ring-2 ring-slate-950"
                          : "min-w-[18px] h-4 px-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px]"
                      }
                    `}
                  >
                    {badgeValue > 99 ? "99+" : badgeValue}
                  </span>
                )}

                {!collapsed && isActive && (
                  <ChevronRight className="w-3.5 h-3.5 text-blue-200" />
                )}
              </button>
            );
          })}
        </nav>

        {/* USER FOOTER SECTION */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950">
          <div
            className={`
              flex items-center rounded-xl transition-colors
              ${collapsed ? "justify-center" : "gap-3 p-2 bg-slate-900/60 border border-slate-800/80"}
            `}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-md">
              {initials}
            </div>

            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">
                    {userName || "Loading..."}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {roleLabel || " "}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onLogout}
                  title="Logout"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            {collapsed && (
              <button
                type="button"
                onClick={onLogout}
                title="Logout"
                className="mt-2 w-8 h-8 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}