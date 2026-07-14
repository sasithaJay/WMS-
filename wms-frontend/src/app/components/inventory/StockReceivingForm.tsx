import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  PlusCircle,
  Trash2,
} from "lucide-react";

import { INVENTORY_ITEMS, GRN_DATA } from "../../constants/mockData";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";

interface ReceiptItemRow {
  rowId: string;
  itemCode: string;
  quantityReceived: string;
  unitCost: string;
  remarks: string;
}

interface ReceiptHeaderForm {
  receivedDate: string;
  supplierName: string;
  invoiceNumber: string;
  notes: string;
}

export interface StockReceiptPayload {
  receivedDate: string;
  supplierName: string;
  invoiceNumber?: string;
  notes?: string;
  items: {
    itemCode: string;
    quantityReceived: number;
    unitCost?: number;
    remarks?: string;
  }[];
}

interface StockReceivingFormProps {
  lang: Lang;

  /*
   * You can pass an API function later:
   *
   * onSave={async (payload) => {
   *   await createStockReceipt(payload);
   * }}
   */
  onSave?: (payload: StockReceiptPayload) => Promise<void> | void;
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
    itemCode: "",
    quantityReceived: "",
    unitCost: "",
    remarks: "",
  };
}

export function StockReceivingForm({
  lang,
  onSave,
}: StockReceivingFormProps) {
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState<ReceiptHeaderForm>({
    receivedDate: getToday(),
    supplierName: "",
    invoiceNumber: "",
    notes: "",
  });

  const [itemRows, setItemRows] = useState<ReceiptItemRow[]>([
    createEmptyItemRow(),
  ]);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const receiptCount = GRN_DATA.length;

  const selectedItemCodes = useMemo(
    () =>
      itemRows
        .map((row) => row.itemCode)
        .filter((itemCode) => itemCode !== ""),
    [itemRows],
  );

  const totalQuantity = useMemo(
    () =>
      itemRows.reduce((total, row) => {
        const quantity = Number(row.quantityReceived);

        return Number.isFinite(quantity) && quantity > 0
          ? total + quantity
          : total;
      }, 0),
    [itemRows],
  );

  const totalValue = useMemo(
    () =>
      itemRows.reduce((total, row) => {
        const quantity = Number(row.quantityReceived);
        const unitCost = Number(row.unitCost);

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
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccessMessage("");
  };

  const updateItemRow = (
    rowId: string,
    field: keyof Omit<ReceiptItemRow, "rowId">,
    value: string,
  ) => {
    setItemRows((currentRows) =>
      currentRows.map((row) =>
        row.rowId === rowId
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );

    setError("");
    setSuccessMessage("");
  };

  const addItemRow = () => {
    setItemRows((currentRows) => [
      ...currentRows,
      createEmptyItemRow(),
    ]);

    setError("");
  };

  const removeItemRow = (rowId: string) => {
    setItemRows((currentRows) => {
      if (currentRows.length === 1) {
        return currentRows;
      }

      return currentRows.filter((row) => row.rowId !== rowId);
    });

    setError("");
  };

  const resetForm = () => {
    setForm({
      receivedDate: getToday(),
      supplierName: "",
      invoiceNumber: "",
      notes: "",
    });

    setItemRows([createEmptyItemRow()]);
    setError("");
  };

  const closeForm = () => {
    resetForm();
    setShowForm(false);
  };

  const validateForm = (): string | null => {
    if (!form.receivedDate) {
      return t(
        lang,
        "Received date is required.",
        "ලැබුණු දිනය අවශ්‍යයි.",
      );
    }

    if (!form.supplierName.trim()) {
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

    const hasUnselectedItem = itemRows.some(
      (row) => row.itemCode === "",
    );

    if (hasUnselectedItem) {
      return t(
        lang,
        "Select an item in every row.",
        "සෑම පේළියකටම භාණ්ඩයක් තෝරන්න.",
      );
    }

    const duplicateItems =
      new Set(selectedItemCodes).size !== selectedItemCodes.length;

    if (duplicateItems) {
      return t(
        lang,
        "The same item cannot be added more than once.",
        "එකම භාණ්ඩය එක් වරකට වඩා එකතු කළ නොහැක.",
      );
    }

    const hasInvalidQuantity = itemRows.some((row) => {
      const quantity = Number(row.quantityReceived);

      return (
        row.quantityReceived.trim() === "" ||
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
      if (row.unitCost.trim() === "") {
        return false;
      }

      const unitCost = Number(row.unitCost);

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

  const handleSubmit = async () => {
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload: StockReceiptPayload = {
      receivedDate: form.receivedDate,
      supplierName: form.supplierName.trim(),
      invoiceNumber: form.invoiceNumber.trim() || undefined,
      notes: form.notes.trim() || undefined,

      items: itemRows.map((row) => ({
        itemCode: row.itemCode,
        quantityReceived: Number(row.quantityReceived),

        unitCost:
          row.unitCost.trim() === ""
            ? undefined
            : Number(row.unitCost),

        remarks: row.remarks.trim() || undefined,
      })),
    };

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      if (onSave) {
        await onSave(payload);
      } else {
        /*
         * Temporary while the backend is not connected.
         * Remove this console.log after connecting the API.
         */
        console.log("Stock receipt payload:", payload);

        await new Promise((resolve) => {
          window.setTimeout(resolve, 500);
        });
      }

      setSuccessMessage(
        t(
          lang,
          "Stock receipt saved successfully.",
          "තොග ලැබීම සාර්ථකව සුරකින ලදී.",
        ),
      );

      resetForm();

      window.setTimeout(() => {
        setShowForm(false);
        setSuccessMessage("");
      }, 1000);
    } catch (saveError) {
      console.error("Failed to save stock receipt:", saveError);

      setError(
        t(
          lang,
          "Unable to save the stock receipt. Please try again.",
          "තොග ලැබීම සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න.",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-500">
          {receiptCount}{" "}
          {t(
            lang,
            "receipts recorded",
            "රිසිට් සටහන් කර ඇත",
          )}
        </p>

        {!showForm && (
          <button
            type="button"
            onClick={() => {
              setShowForm(true);
              setError("");
              setSuccessMessage("");
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#4295D9] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#3280C4]"
          >
            <PlusCircle className="h-4 w-4" />

            {t(
              lang,
              "Record Receipt",
              "රිසිට් සටහන් කරන්න",
            )}
          </button>
        )}
      </div>

      {showForm && (
        <div className="space-y-6 rounded-xl border border-[#4295D9]/30 bg-white p-5 shadow-sm md:p-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {t(
                lang,
                "New Stock Receipt",
                "නව ගබඩා රිසිට්",
              )}
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
                value={form.receivedDate}
                onChange={(event) =>
                  updateHeaderField(
                    "receivedDate",
                    event.target.value,
                  )
                }
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#4295D9] focus:bg-white focus:ring-2 focus:ring-[#4295D9]/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                {t(
                  lang,
                  "Supplier Name",
                  "සැපයුම්කරු නාමය",
                )}
                <span className="ml-1 text-red-500">*</span>
              </label>

              <input
                type="text"
                value={form.supplierName}
                onChange={(event) =>
                  updateHeaderField(
                    "supplierName",
                    event.target.value,
                  )
                }
                placeholder={t(
                  lang,
                  "Enter supplier or source",
                  "සැපයුම්කරු හෝ මූලාශ්‍රය ඇතුළත් කරන්න",
                )}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#4295D9] focus:bg-white focus:ring-2 focus:ring-[#4295D9]/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-600">
                {t(
                  lang,
                  "Invoice Number",
                  "ඉන්වොයිස් අංකය",
                )}
              </label>

              <input
                type="text"
                value={form.invoiceNumber}
                onChange={(event) =>
                  updateHeaderField(
                    "invoiceNumber",
                    event.target.value,
                  )
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
                  {t(
                    lang,
                    "Received Items",
                    "ලැබුණු භාණ්ඩ",
                  )}
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
                      title={t(
                        lang,
                        "Remove item",
                        "භාණ්ඩය ඉවත් කරන්න",
                      )}
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
                        value={row.itemCode}
                        onChange={(event) =>
                          updateItemRow(
                            row.rowId,
                            "itemCode",
                            event.target.value,
                          )
                        }
                        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20"
                      >
                        <option value="">
                          {t(
                            lang,
                            "Select item…",
                            "භාණ්ඩය තෝරන්න…",
                          )}
                        </option>

                        {INVENTORY_ITEMS.map((item) => {
                          const alreadySelected =
                            selectedItemCodes.includes(item.code) &&
                            row.itemCode !== item.code;

                          return (
                            <option
                              key={item.code}
                              value={item.code}
                              disabled={alreadySelected}
                            >
                              {item.code} - {item.name}
                              {alreadySelected
                                ? t(
                                    lang,
                                    " (Already selected)",
                                    " (දැනටමත් තෝරා ඇත)",
                                  )
                                : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="lg:col-span-2">
                      <label className="mb-1.5 block text-xs font-medium text-gray-600">
                        {t(
                          lang,
                          "Quantity Received",
                          "ලැබුණු ප්‍රමාණය",
                        )}
                        <span className="ml-1 text-red-500">*</span>
                      </label>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={row.quantityReceived}
                        onChange={(event) =>
                          updateItemRow(
                            row.rowId,
                            "quantityReceived",
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
                        value={row.unitCost}
                        onChange={(event) =>
                          updateItemRow(
                            row.rowId,
                            "unitCost",
                            event.target.value,
                          )
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
                          updateItemRow(
                            row.rowId,
                            "remarks",
                            event.target.value,
                          )
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
                {t(
                  lang,
                  "Total Quantity",
                  "මුළු ප්‍රමාණය",
                )}
              </p>

              <p className="mt-1 text-lg font-bold text-gray-900">
                {totalQuantity}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                {t(
                  lang,
                  "Estimated Total Value",
                  "ඇස්තමේන්තුගත මුළු වටිනාකම",
                )}
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

          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row">
            <button
              type="button"
              onClick={closeForm}
              disabled={submitting}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t(lang, "Cancel", "අවලංගු")}
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 rounded-xl bg-[#4295D9] py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#3280C4] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? t(lang, "Saving…", "සුරකිමින්…")
                : t(
                    lang,
                    "Save Stock Receipt",
                    "තොග රිසිට් සුරකින්න",
                  )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}