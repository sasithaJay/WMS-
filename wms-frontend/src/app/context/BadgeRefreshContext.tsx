// src/app/context/BadgeRefreshContext.tsx

import { createContext, useContext } from "react";

interface BadgeRefreshContextValue {
  triggerBadgeRefresh: () => void;
}

export const BadgeRefreshContext = createContext<BadgeRefreshContextValue>({
  triggerBadgeRefresh: () => {},
});

export function useBadgeRefresh() {
  return useContext(BadgeRefreshContext);
}