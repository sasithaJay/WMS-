import { useEffect, useState } from "react";
import { NAV_ITEMS } from "../constants/menuItems";
import type { Role } from "../types";

const STORAGE_PREFIX = "wms.dashboard.activeNav.";

function isAllowedNav(role: Role, value: string | null): value is string {
  return Boolean(value && NAV_ITEMS[role]?.some((item) => item.id === value));
}

/** Keeps the current role's selected dashboard tab across a page refresh. */
export function usePersistentActiveNav(role: Role) {
  const storageKey = `${STORAGE_PREFIX}${role}`;
  const [activeNav, setActiveNav] = useState(() => {
    try {
      const saved = sessionStorage.getItem(storageKey);
      return isAllowedNav(role, saved) ? saved : "dashboard";
    } catch {
      return "dashboard";
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, activeNav);
    } catch {
      // The dashboard remains usable when browser storage is unavailable.
    }
  }, [activeNav, storageKey]);

  return [activeNav, setActiveNav] as const;
}

export function clearPersistentActiveNav() {
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(STORAGE_PREFIX)) sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors during logout.
  }
}
