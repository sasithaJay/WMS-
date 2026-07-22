

import api from "../api/axios";

export interface InventoryBalanceInfo {
  item_id: number;
  quantity_on_hand: number;
  reserved_quantity: number;
  available: number;
}

export async function getInventoryBalances(
  itemIds: number[],
): Promise<Record<number, InventoryBalanceInfo>> {
  if (itemIds.length === 0) return {};

  const response = await api.get("/inventory-balances", {
    params: { item_ids: itemIds },
  });

  const map: Record<number, InventoryBalanceInfo> = {};
  (response.data.data as InventoryBalanceInfo[]).forEach((b) => {
    map[b.item_id] = b;
  });
  return map;
}