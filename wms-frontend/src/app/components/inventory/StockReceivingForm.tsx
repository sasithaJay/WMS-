import { useMemo, useState, useEffect } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  PlusCircle,
  Trash2,
} from "lucide-react";
import { AxiosError } from "axios";

import { getItems } from "../../../services/ItemService";
import { createStockReceipt, updateStockReceipt } from "../../../services/stockReceiptService";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type {
  CreateStockReceiptPayload,
  StockReceipt,
} from "../../../app/types/stockReceipts";

interface Item {
  id: number;
  item_code: string;
  name_en: string;
  name_si?: string;
}

interface ReceiptItemRow {
  rowId: string;
  item_id: number | "";
  quantity_received: string;
  unit_cost: string;
  remarks: string;
}

interface ReceiptHeaderForm {
  received_date: string;
  supplier_name: string;
  invoice_number: string;
  notes: string;
}

interface StockReceivingFormProps {
  lang: Lang;
  onSaved?: (receipt: StockReceipt) => void;
  /** If provided, form opens pre-filled in edit mode instead of create mode */
  editingReceipt?: StockReceipt | null;
  /** Called when the user cancels/closes edit mode */
  onCancelEdit?: () => void;
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

function createRowId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createEmptyItemRow(): ReceiptItemRow {
  return {
    rowId: createRowId(),
    item_id: "",
    quantity_received: "",
    unit_cost: "",
    remarks: "",
  };
}

// Laravel 422 shape: { message: string, errors: { [field]: string[] } }
interface LaravelValidationErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

export function StockReceivingForm({
  lang,
  onSaved,
  editingReceipt = null,
  onCancelEdit,
}: StockReceivingFormProps) {
  const [showForm, setShowForm] = useState(false);
  const isEditMode = editingReceipt !== null;
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const [form, setForm] = useState<ReceiptHeaderForm>({
    received_date: getToday(),
    supplier_name: "",
    invoice_number: "",
    notes: "",
  });

  const [itemRows, setItemRows] = useState<ReceiptItemRow[]>([
    createEmptyItemRow(),
  ]);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lastGrnNumber, setLastGrnNumber] = useState<string | null>(null);
  const [receiptCount, setReceiptCount] = useState(0);

  useEffect(() => {
    if (editingReceipt) {
      setForm({
        received_date: editingReceipt.received_date,
        supplier_name: editingReceipt.supplier_name,
        invoice_number: editingReceipt.invoice_number ?? "",
        notes: editingReceipt.notes ?? "",
      });

      setItemRows(
        (editingReceipt.items ?? []).map((item) => ({
          rowId: createRowId(),
          item_id: item.item_id,
          quantity_received: String(item.quantity_received),
          unit_cost: item.unit_cost !== null ? String(item.unit_cost) : "",
          remarks: item.remarks ?? "",
        })),
      );

      setShowForm(true);
    }
  }, [editingReceipt]);

  const closeForm = () => {
    resetForm();
    setShowForm(false);
    if (isEditMode) {
      onCancelEdit?.();
    }
  };

  useEffect(() => {
    loadItems();
  }, []);

  async function loadItems() {
    try {
      setLoadingItems(true);
      const response = await getItems({ per_page: 500 });
      setItems(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  }

  const selectedItemIds = useMemo(
    () =>
      itemRows
        .map((row) => row.item_id)
        .filter((id): id is number => id !== ""),
    [itemRows],
  );

  const totalQuantity = useMemo(
    () =>
      itemRows.reduce((total, row) => {
        const quantity = Number(row.quantity_received);
        return Number.isFinite(quantity) && quantity > 0
          ? total + quantity
          : total;
      }, 0),
    [itemRows],
  );

  const totalValue = useMemo(
    () =>
      itemRows.reduce((total, row) => {
        const quantity = Number(row.quantity_received);
        const unitCost = Number(row.unit_cost);

        if (
          !Number.isFinite(quantity) ||
          !Number.isFinite(unitCost) ||
          quantity <= 0 ||
          unitCost < 0
        ) {
          return total;
        }
        return total + quantity * unitCost;
      }, 0),
    [itemRows],
  );

  const updateHeaderField = (
    field: keyof ReceiptHeaderForm,
    value: string,
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccessMessage("");
  };

  const updateItemRow = (
    rowId: string,
    field: keyof Omit<ReceiptItemRow, "rowId">,
    value: string,
  ) => {
    setItemRows((currentRows) =>
      currentRows.map((row) => {
        if (row.rowId !== rowId) return row;

        if (field === "item_id") {
          return {
            ...row,
            item_id: value === "" ? "" : Number(value),
          };
        }

        return { ...row, [field]: value };
      }),
    );
    setError("");
    setSuccessMessage("");
  };

  const addItemRow = () => {
    setItemRows((currentRows) => [...currentRows, createEmptyItemRow()]);
    setError("");
  };

  const removeItemRow = (rowId: string) => {
    setItemRows((currentRows) => {
      if (currentRows.length === 1) return currentRows;
      return currentRows.filter((row) => row.rowId !== rowId);
    });
    setError("");
  };

  const resetForm = () => {
    setForm({
      received_date: getToday(),
      supplier_name: "",
      invoice_number: "",
      notes: "",
    });
    setItemRows([createEmptyItemRow()]);
    setError("");
    setFieldErrors({});
  };

  const validateForm = (): string | null => {
    if (!form.received_date.trim()) {
      return t(lang, "Received date is required.", "ලැබුණු දිනය අවශ්‍යයි.");
    }

    if (!form.supplier_name.trim()) {
      return t(
        lang,
        "Supplier name is required.",
        "සැපයුම්කරුගේ නම අවශ්‍යයි.",
      );
    }

    if (itemRows.length === 0) {
      return t(
        lang,
        "Add at least one item.",
        "අවම වශයෙන් එක් භාණ්ඩයක් එක් කරන්න.",
      );
    }

    const hasUnselectedItem = itemRows.some((row) => row.item_id === "");
    if (hasUnselectedItem) {
      return t(
        lang,
        "Select an item in every row.",
        "සෑම පේළියකටම භාණ්ඩයක් තෝරන්න.",
      );
    }

    const duplicateItems =
      new Set(selectedItemIds).size !== selectedItemIds.length;
    if (duplicateItems) {
      return t(
        lang,
        "The same item cannot be added more than once.",
        "එකම භාණ්ඩය එක් වරකට වඩා එකතු කළ නොහැක.",
      );
    }

    const hasInvalidQuantity = itemRows.some((row) => {
      const quantity = Number(row.quantity_received);
      return (
        row.quantity_received.trim() === "" ||
        !Number.isFinite(quantity) ||
        quantity <= 0
      );
    });
    if (hasInvalidQuantity) {
      return t(
        lang,
        "Every received quantity must be greater than zero.",
        "සෑම ලැබුණු ප්‍රමාණයක්ම ශුන්‍යයට වඩා වැඩි විය යුතුය.",
      );
    }

    const hasInvalidUnitCost = itemRows.some((row) => {
      if (row.unit_cost.trim() === "") return false;
      const unitCost = Number(row.unit_cost);
      return !Number.isFinite(unitCost) || unitCost < 0;
    });
    if (hasInvalidUnitCost) {
      return t(
        lang,
        "Unit cost cannot be negative.",
        "ඒකක මිල ඍණ අගයක් විය නොහැක.",
      );
    }

    return null;
  };

  // Maps Laravel's "items.0.quantity_received" style keys to something
  // readable, and surfaces the first message per row-level field.
  const applyServerValidationErrors = (
    errors: Record<string, string[]>,
  ) => {
    const flat: Record<string, string> = {};

    Object.entries(errors).forEach(([key, messages]) => {
      flat[key] = messages[0];
    });

    setFieldErrors(flat);

    const firstMessage = Object.values(flat)[0];
    if (firstMessage) {
      setError(firstMessage);
    }
  };

  const handleSubmit = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: CreateStockReceiptPayload = {
      supplier_name: form.supplier_name.trim(),
      invoice_number: form.invoice_number.trim() || undefined,
      received_date: form.received_date,
      notes: form.notes.trim() || undefined,
      items: itemRows.map((row) => ({
        item_id: row.item_id as number,
        quantity_received: Number(row.quantity_received),
        unit_cost: row.unit_cost.trim() === "" ? undefined : Number(row.unit_cost),
        remarks: row.remarks.trim() || undefined,
      })),
    };

    try {
      setSubmitting(true);
      setError("");
      setFieldErrors({});
      setSuccessMessage("");

      const receipt = isEditMode
        ? await updateStockReceipt(editingReceipt!.id, payload)
        : await createStockReceipt(payload);

      if (!isEditMode) {
        setReceiptCount((count) => count + 1);
        setLastGrnNumber(receipt.grn_number);
      }

      setReceiptCount((count) => count + 1);
      setLastGrnNumber(receipt.grn_number);

      setSuccessMessage(
        isEditMode
          ? t(lang, `Receipt ${receipt.grn_number} updated.`, `රිසිට් ${receipt.grn_number} යාවත්කාලීන කරන ලදී.`)
          : t(lang, `Stock receipt ${receipt.grn_number} saved successfully.`, `තොග රිසිට් ${receipt.grn_number} සාර්ථකව සුරකින ලදී.`),
      );

      onSaved?.(receipt);
      resetForm();

      window.setTimeout(() => {
        setShowForm(false);
        setSuccessMessage("");
      }, 1500);
    } catch (err) {
      const axiosError = err as AxiosError<LaravelValidationErrorBody>;

      if (axiosError.response?.status === 422) {
        const body = axiosError.response.data;
        if (body?.errors) {
          applyServerValidationErrors(body.errors);
        } else {
          setError(
            body?.message ??
              t(
                lang,
                "Please check the form for errors.",
                "පෝරමයේ දෝෂ ඇත්දැයි පරීක්ෂා කරන්න.",
              ),
          );
        }
      } else if (axiosError.response?.status === 403) {
        setError(
          t(
            lang,
            "You are not authorized to record stock receipts.",
            "තොග ලැබීම් සටහන් කිරීමට ඔබට අවසර නැත.",
          ),
        );
      } else {
        console.error("Failed to save stock receipt:", err);
        setError(
          t(
            lang,
            "Unable to save the stock receipt. Please try again.",
            "තොග ලැබීම සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.",
          ),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          {receiptCount}{" "}
          {t(lang, "receipts recorded this session", "රිසිට් සටහන් කර ඇත")}
          {lastGrnNumber && (
            <span className="ml-1 text-gray-400">
              ({t(lang, "last", "අවසන්")}: {lastGrnNumber})
            </span>
          )}
        </p>

        {!showForm && (
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setError("");
              setFieldErrors({});
              setSuccessMessage("");
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#4295D9] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#3280C4]"
          >
            <PlusCircle className="h-4 w-4" />
            {t(lang, "Record Receipt", "රිසිට් සටහන් කරන්න")}
          </button>
        )}
      </div>

      {showForm && (
        <div className="space-y-6 rounded-xl border border-[#4295D9]/30 bg-white p-5 shadow-sm md:p-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {t(lang, "New Stock Receipt", "නව ගබඩා රිසිට්")}
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              {t(
                lang,
                "Record all items received under one GRN.",
                "එක් GRN එකක් යටතේ ලැබුණු සියලු භාණ්ඩ සටහන් කරන්න.",
              )}
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Receipt header information */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                {t(lang, "Received Date", "ලැබුණු දිනය")}
                <span className="ml-1 text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.received_date}
                onChange={(event) =>
                  updateHeaderField("received_date", event.target.value)
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#4295D9] focus:bg-white focus:ring-2 focus:ring-[#4295D9]/20"
              />
              {fieldErrors.received_date && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.received_date}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                {t(lang, "Supplier Name", "සැපයුම්කරු නාමය")}
                <span className="ml-1 text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.supplier_name}
                onChange={(event) =>
                  updateHeaderField("supplier_name", event.target.value)
                }
                placeholder={t(
                  lang,
                  "Enter supplier or source",
                  "සැපයුම්කරු හෝ මූලාශ්‍රය ඇතුළත් කරන්න",
                )}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#4295D9] focus:bg-white focus:ring-2 focus:ring-[#4295D9]/20"
              />
              {fieldErrors.supplier_name && (
                <p className="mt-1 text-xs text-red-500">
                  {fieldErrors.supplier_name}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                {t(lang, "Invoice Number", "ඉන්වොයිස් අංකය")}
              </label>
              <input
                type="text"
                value={form.invoice_number}
                onChange={(event) =>
                  updateHeaderField("invoice_number", event.target.value)
                }
                placeholder={t(
                  lang,
                  "Optional invoice number",
                  "අවශ්‍ය නම් ඉන්වොයිස් අංකය",
                )}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#4295D9] focus:bg-white focus:ring-2 focus:ring-[#4295D9]/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                {t(lang, "GRN Number", "GRN අංකය")}
              </label>
              <input
                type="text"
                value={t(
                  lang,
                  "Generated automatically when saved",
                  "සුරකින විට ස්වයංක්‍රීයව නිර්මාණය වේ",
                )}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 px-3.5 py-2.5 text-sm text-gray-400 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                {t(lang, "Notes", "සටහන්")}
              </label>
              <textarea
                rows={3}
                value={form.notes}
                onChange={(event) =>
                  updateHeaderField("notes", event.target.value)
                }
                placeholder={t(
                  lang,
                  "Add any additional notes",
                  "අමතර සටහන් ඇතුළත් කරන්න",
                )}
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#4295D9] focus:bg-white focus:ring-2 focus:ring-[#4295D9]/20"
              />
            </div>
          </div>

          {/* Receipt items */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">
                  {t(lang, "Received Items", "ලැබුණු භාණ්ඩ")}
                </h4>
                <p className="mt-1 text-xs text-gray-500">
                  {t(
                    lang,
                    "Add every item included in this receipt.",
                    "මෙම රිසිට් එකට අදාළ සියලු භාණ්ඩ එක් කරන්න.",
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#4295D9] px-3.5 py-2 text-xs font-semibold text-[#4295D9] transition hover:bg-blue-50"
              >
                <Plus className="h-4 w-4" />
                {t(lang, "Add Item", "භාණ්ඩයක් එක් කරන්න")}
              </button>
            </div>

            <div className="space-y-4">
              {itemRows.map((row, index) => (
                <div
                  key={row.rowId}
                  className="rounded-xl border border-gray-200 bg-gray-50/50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500">
                      {t(lang, "Item", "භාණ්ඩය")} {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItemRow(row.rowId)}
                      disabled={itemRows.length === 1}
                      title={t(lang, "Remove item", "භාණ්ඩය ඉවත් කරන්න")}
                      className="rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                    <div className="lg:col-span-4">
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        {t(lang, "Item", "භාණ්ඩය")}
                        <span className="ml-1 text-red-500">*</span>
                      </label>
                      <select
                        value={row.item_id === "" ? "" : String(row.item_id)}
                        disabled={loadingItems}
                        onChange={(event) =>
                          updateItemRow(row.rowId, "item_id", event.target.value)
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20"
                      >
                        <option value="">
                          {loadingItems
                            ? t(lang, "Loading items…", "පූරණය වෙමින්…")
                            : t(lang, "Select item…", "භාණ්ඩය තෝරන්න…")}
                        </option>

                        {items.map((item) => {
                          const alreadySelected =
                            selectedItemIds.includes(item.id) &&
                            row.item_id !== item.id;

                          return (
                            <option
                              key={item.id}
                              value={item.id}
                              disabled={alreadySelected}
                            >
                              {item.item_code} - {item.name_en}
                              {alreadySelected
                                ? t(lang, " (Already selected)", " (දැනටමත් තෝරා ඇත)")
                                : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="lg:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        {t(lang, "Quantity Received", "ලැබුණු ප්‍රමාණය")}
                        <span className="ml-1 text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={row.quantity_received}
                        onChange={(event) =>
                          updateItemRow(
                            row.rowId,
                            "quantity_received",
                            event.target.value,
                          )
                        }
                        placeholder="0"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20"
                      />
                    </div>

                    <div className="lg:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        {t(lang, "Unit Cost", "ඒකක මිල")}
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.unit_cost}
                        onChange={(event) =>
                          updateItemRow(row.rowId, "unit_cost", event.target.value)
                        }
                        placeholder="0.00"
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20"
                      />
                    </div>

                    <div className="lg:col-span-4">
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        {t(lang, "Remarks", "සටහන්")}
                      </label>
                      <input
                        type="text"
                        value={row.remarks}
                        onChange={(event) =>
                          updateItemRow(row.rowId, "remarks", event.target.value)
                        }
                        placeholder={t(
                          lang,
                          "Optional remarks",
                          "අවශ්‍ය නම් සටහන්",
                        )}
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Receipt summary */}
          <div className="grid grid-cols-1 gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 sm:grid-cols-3">
            <div>
              <p className="text-xs text-gray-500">
                {t(lang, "Item Rows", "භාණ්ඩ පේළි")}
              </p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {itemRows.length}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                {t(lang, "Total Quantity", "මුළු ප්‍රමාණය")}
              </p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {totalQuantity}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                {t(lang, "Estimated Total Value", "ඇස්තමේන්තුගත මුළු වටිනාකම")}
              </p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                Rs.{" "}
                {totalValue.toLocaleString("en-LK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeForm}
              disabled={submitting}
              className="w-full rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {t(lang, "Cancel", "අවලංගු")}
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full rounded-xl bg-[#4295D9] px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#3280C4] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitting
                ? t(lang, "Saving…", "සුරකිමින්…")
                : t(lang, "Save Stock Receipt", "තොග රිසිට් සුරකින්න")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}