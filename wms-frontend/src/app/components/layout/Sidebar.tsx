import { Menu, X, Warehouse, LogOut } from "lucide-react";
import { NAV_ITEMS } from "../../constants/menuItems";
import { t } from "../../constants/translations";
import type { Lang, Role } from "../../types";
import { User } from "../../types/auth";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../../../services/authService";
import logo from "../../resources/logo.jpeg";

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
  role: Role;
  setLang: (l: Lang) => void;
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
      getCurrentUser().then(setCurrentUser).catch((err) => console.error(err));
    }, []);

  return (
    <aside
      className={`flex flex-col border-r border-gray-100 transition-all duration-300 ${
        collapsed ? "w-[60px]" : "w-[220px]"
      } min-h-screen`
      } 
    >

      {/* Logo / Toggle */}
      <div
        className={`flex items-center border-b border-gray-100 ${
          collapsed ? "justify-center px-0 py-5" : "gap-3 px-4 py-5"
        }`}
      >
        {!collapsed && (
          <>
            <div className="w-15 h-15 rounded-full flex items-center sticky top-0 z-100 justify-center flex-shrink-0">
              {/* <Warehouse className="w-5 h-5 text-white" /> */}
              <img className="rounded-full" src={logo} alt="Logo" />
            </div>

            <div className="overflow-hidden">
              <div className="text-sm font-bold text-gray-900 leading-tight">WMS</div>
              <div className="text-[10px] text-gray-400 leading-tight">
                Social Welfare & Probation & Child Care
              </div>
            </div>
          </>
        )}

        <button
          onClick={onToggle}
          className={`text-white-400 hover:white-gray-600 transition-colors flex-shrink-0 ${
            collapsed ? "" : "ml-auto"
          }`}
        >
          {collapsed ? <Menu className="w-5 h-5" /> : <X className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-0.5" style={{ background: "linear-gradient(135deg, #4295D9 0%, #1A5FA8 100%)" }}>
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          const badgeValue = badges[item.id];

          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative mb-2 ${
                isActive
                  ? "bg-[#EBF4FD] text-[#116bb4]"
                  : "text-white/90 bg-white/20 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#116bb4]" : ""}`} />
              {!collapsed && (
                <span className="flex-1 text-left truncate">
                  {t(lang, item.label, item.labelSi)}
                </span>
              )}
              {!collapsed && badgeValue !== undefined && badgeValue > 0 && (
                <span className="bg-[#35df6e] text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {badgeValue}
                </span>
              )}
              {collapsed && badgeValue !== undefined && badgeValue > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {badgeValue}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-gray-100 p-3" >
        <div className={`flex items-center gap-3 rounded-xl p-2 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-lg bg-[#4295D9] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            {getDisplayName(currentUser)?.[0]}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-semibold text-gray-900 truncate">{userName || "\u00A0"}</div>
              <div className="text-[10px] text-gray-500 truncate">{roleLabel}</div>
            </div>
          )}
          {!collapsed && (
            <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition-colors hover:bg-red-50 p-1 rounded-lg flex-shrink-0 cursor-pointer">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
