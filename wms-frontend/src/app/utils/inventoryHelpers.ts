import type { InventoryItem } from "../types/inventory";

export type StockStatus = "out_of_stock" | "low_stock" | "normal";

export function getCurrentQuantity(
  item: InventoryItem,
): number {
  return item.balance?.quantity_on_hand ?? 0;
}

export function getAvailableQuantity(
  item: InventoryItem,
): number {
  const quantityOnHand =
    item.balance?.quantity_on_hand ?? 0;

  const reservedQuantity =
    item.balance?.reserved_quantity ?? 0;

  return Math.max(
    quantityOnHand - reservedQuantity,
    0,
  );
}

export function getStockStatus(
  item: InventoryItem,
): StockStatus {
  const quantity = getCurrentQuantity(item);

  if (quantity === 0) {
    return "out_of_stock";
  }

  if (quantity <= item.reorder_level) {
    return "low_stock";
  }

  return "normal";
}