import { Menu, X, Warehouse, LogOut } from "lucide-react";
import { NAV_ITEMS } from "../../constants/menuItems";
import { ROLE_LABELS } from "../../constants/roles";
import { t } from "../../constants/translations";
import { getRoleUserName } from "../../utils/roleHelpers";
import type { Lang, Role } from "../../types";

export function Sidebar({
  lang,
  role,
  active,
  setActive,
  collapsed,
  onToggle,
  onLogout,
}: {
  lang: Lang;
  role: Role;
  active: string;
  setActive: (id: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  onLogout: () => void;
}) {
  const nav = NAV_ITEMS[role];
  const roleLabel = ROLE_LABELS[role] ?? { en: role, si: role };
  const userName = getRoleUserName(role);

  return (
    <aside
      className={`flex flex-col bg-white border-r border-gray-100 transition-all duration-300 ${
        collapsed ? "w-[68px]" : "w-[220px]"
      } min-h-screen`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-[#4295D9] flex items-center justify-center flex-shrink-0">
          <Warehouse className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-sm font-bold text-gray-900 leading-tight">WMS</div>
            <div className="text-[10px] text-gray-400 leading-tight">Gov. Sri Lanka</div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="ml-auto text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
        >
          {collapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2 space-y-0.5">
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                isActive
                  ? "bg-[#EBF4FD] text-[#4295D9]"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
              }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-[#4295D9]" : ""}`} />
              {!collapsed && (
                <span className="flex-1 text-left truncate">
                  {t(lang, item.label, item.labelSi)}
                </span>
              )}
              {!collapsed && "badge" in item && item.badge && (
                <span className="bg-[#4295D9] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {item.badge}
                </span>
              )}
              {collapsed && "badge" in item && item.badge && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-gray-100 p-3">
        <div className={`flex items-center gap-3 rounded-xl p-2 ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-lg bg-[#4295D9] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            {userName[0]}
          </div>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <div className="text-xs font-semibold text-gray-900 truncate">{userName}</div>
              <div className="text-[10px] text-gray-400 truncate">{t(lang, roleLabel.en, roleLabel.si)}</div>
            </div>
          )}
          {!collapsed && (
            <button onClick={onLogout} className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
