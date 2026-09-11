import { useMemo, useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Plus,
  PlusCircle,
  Trash2,
  Loader2,
  Receipt,
  Scan,
} from "lucide-react";
import { AxiosError } from "axios";

import { getItems, lookupItemByCode } from "../../../services/ItemService";
import { createStockReceipt, updateStockReceipt } from "../../../services/stockReceiptService";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type {
  CreateStockReceiptPayload,
  StockReceipt,
} from "../../../app/types/stockReceipts";
import { BarcodeScannerInput } from "../ui/BarcodeScannerInput";
import { getCurrentVatRate } from "../../../services/vatRateService";

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
  editingReceipt?: StockReceipt | null;
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
  const [currentVatPercentage, setCurrentVatPercentage] = useState(0);

  useEffect(() => {
    getCurrentVatRate()
      .then((res) => setCurrentVatPercentage(res.data.percentage))
      .catch(() => {});
  }, []);

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
  const [scanError, setScanError] = useState("");
  const quantityInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  async function handleScan(code: string) {
    setScanError("");

    try {
      const item = await lookupItemByCode(code);

      const existingRow = itemRows.find((row) => row.item_id === item.id);

      if (existingRow) {
        quantityInputRefs.current[existingRow.rowId]?.focus();
        quantityInputRefs.current[existingRow.rowId]?.select();
        return;
      }

      const emptyRow = itemRows.find((row) => row.item_id === "");
      const targetRowId = emptyRow ? emptyRow.rowId : createRowId();

      setItemRows((currentRows) => {
        if (emptyRow) {
          return currentRows.map((row) =>
            row.rowId === targetRowId ? { ...row, item_id: item.id } : row
          );
        }
        return [
          ...currentRows,
          { ...createEmptyItemRow(), rowId: targetRowId, item_id: item.id },
        ];
      });

      setTimeout(() => {
        quantityInputRefs.current[targetRowId]?.focus();
      }, 0);
    } catch (err) {
      console.error(err);
      setScanError(
        t(
          lang,
          `No item found for code "${code}".`,
          `"${code}" සඳහා භාණ්ඩයක් හමු නොවීය.`
        )
      );
    }
  }

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
        }))
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
    [itemRows]
  );

  const totalQuantity = useMemo(
    () =>
      itemRows.reduce((total, row) => {
        const quantity = Number(row.quantity_received);
        return Number.isFinite(quantity) && quantity > 0
          ? total + quantity
          : total;
      }, 0),
    [itemRows]
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
    [itemRows]
  );

  const vatAmount = useMemo(
    () => totalValue * (currentVatPercentage / 100),
    [totalValue, currentVatPercentage]
  );

  const totalWithVat = useMemo(
    () => totalValue + vatAmount,
    [totalValue, vatAmount]
  );

  const updateHeaderField = (
    field: keyof ReceiptHeaderForm,
    value: string
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccessMessage("");
  };

  const updateItemRow = (
    rowId: string,
    field: keyof Omit<ReceiptItemRow, "rowId">,
    value: string
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
      })
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
        "සැපයුම්කරුගේ නම අවශ්‍යයි."
      );
    }

    if (itemRows.length === 0) {
      return t(
        lang,
        "Add at least one item.",
        "අවම වශයෙන් එක් භාණ්ඩයක් එක් කරන්න."
      );
    }

    const hasUnselectedItem = itemRows.some((row) => row.item_id === "");
    if (hasUnselectedItem) {
      return t(
        lang,
        "Select an item in every row.",
        "සෑම පේළියකටම භාණ්ඩයක් තෝරන්න."
      );
    }

    const duplicateItems =
      new Set(selectedItemIds).size !== selectedItemIds.length;
    if (duplicateItems) {
      return t(
        lang,
        "The same item cannot be added more than once.",
        "එකම භාණ්ඩය එක් වරකට වඩා එකතු කළ නොහැක."
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
        "සෑම ලැබුණු ප්‍රමාණයක්ම ශුන්‍යයට වඩා වැඩි විය යුතුය."
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
        "ඒකක මිල ඍණ අගයක් විය නොහැක."
      );
    }

    return null;
  };

  const applyServerValidationErrors = (
    errors: Record<string, string[]>
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

      setSuccessMessage(
        isEditMode
          ? t(
              lang,
              `Receipt ${receipt.grn_number} updated.`,
              `රිසිට් ${receipt.grn_number} යාවත්කාලීන කරන ලදී.`
            )
          : t(
              lang,
              `Stock receipt ${receipt.grn_number} saved successfully.`,
              `තොග රිසිට් ${receipt.grn_number} සාර්ථකව සුරකින ලදී.`
            )
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
                "පෝරමයේ දෝෂ ඇත්දැයි පරීක්ෂා කරන්න."
              )
          );
        }
      } else if (axiosError.response?.status === 403) {
        setError(
          t(
            lang,
            "You are not authorized to record stock receipts.",
            "තොග ලැබීම් සටහන් කිරීමට ඔබට අවසර නැත."
          )
        );
      } else {
        console.error("Failed to save stock receipt:", err);
        setError(
          t(
            lang,
            "Unable to save the stock receipt. Please try again.",
            "තොග ලැබීම සුරැකීමට නොහැකි විය. නැවත උත්සාහ කරන්න."
          )
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* HEADER BAR WITH SESSION STATS & RECORD TOGGLE */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
          <Receipt className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            {receiptCount}{" "}
            {t(lang, "receipts recorded this session", "රිසිට් සටහන් කර ඇත")}
          </span>
          {lastGrnNumber && (
            <span className="text-slate-400 font-mono">
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
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t(lang, "Record Receipt", "රිසිට් සටහන් කරන්න")}</span>
          </button>
        )}
      </div>

      {/* EXPANDABLE FORM CONTAINER */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-6">
          {/* Form Section Title */}
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              {isEditMode
                ? t(lang, "Edit Stock Receipt", "තොග රිසිට්පත සංස්කරණය කරන්න")
                : t(lang, "New Stock Receipt", "නව ගබඩා රිසිට්")}
            </h3>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">
              {t(
                lang,
                "Record all items received under one GRN.",
                "එක් GRN එකක් යටතේ ලැබුණු සියලු භාණ්ඩ සටහන් කරන්න."
              )}
            </p>
          </div>

          {/* Validation Error Alert */}
          {error && (
            <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs font-semibold text-rose-700 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Notification */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-xs font-bold text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* RECEIPT HEADER FIELDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t(lang, "Received Date", "ලැබුණු දිනය")}
                <span className="text-rose-500"> *</span>
              </label>
              <input
                type="date"
                value={form.received_date}
                onChange={(event) =>
                  updateHeaderField("received_date", event.target.value)
                }
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />
              {fieldErrors.received_date && (
                <p className="mt-1 text-[11px] font-semibold text-rose-500">
                  {fieldErrors.received_date}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t(lang, "Supplier Name", "සැපයුම්කරු නාමය")}
                <span className="text-rose-500"> *</span>
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
                  "සැපයුම්කරු හෝ මූලාශ්‍රය ඇතුළත් කරන්න"
                )}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
              />
              {fieldErrors.supplier_name && (
                <p className="mt-1 text-[11px] font-semibold text-rose-500">
                  {fieldErrors.supplier_name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
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
                  "අවශ්‍ය නම් ඉන්වොයිස් අංකය"
                )}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t(lang, "GRN Number", "GRN අංකය")}
              </label>
              <input
                type="text"
                value={t(
                  lang,
                  "Generated automatically when saved",
                  "සුරකින විට ස්වයංක්‍රීයව නිර්මාණය වේ"
                )}
                disabled
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-100/70 text-xs font-medium text-slate-400 cursor-not-allowed outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t(lang, "Notes", "සටහන්")}
              </label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(event) =>
                  updateHeaderField("notes", event.target.value)
                }
                placeholder={t(
                  lang,
                  "Add any additional notes",
                  "අමතර සටහන් ඇතුළත් කරන්න"
                )}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* BARCODE SCANNER & ITEM ENTRIES */}
          <div className="space-y-4 pt-2 border-t border-slate-100">
            <div className="max-w-md">
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                <Scan className="w-3.5 h-3.5 text-blue-600" />
                <span>{t(lang, "Scan Item", "භාණ්ඩය ස්කෑන් කරන්න")}</span>
              </label>
              <BarcodeScannerInput
                lang={lang}
                onScan={handleScan}
                placeholder={t(
                  lang,
                  "Scan barcode/QR or type item code…",
                  "බාර්කේතය/QR ස්කෑන් කරන්න හෝ කේතය ටයිප් කරන්න…"
                )}
                autoFocus
              />
              {scanError && (
                <p className="mt-1.5 text-[11px] font-semibold text-rose-500">
                  {scanError}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  {t(lang, "Received Items", "ලැබුණු භාණ්ඩ")}
                </h4>
                <p className="text-[11px] font-medium text-slate-400">
                  {t(
                    lang,
                    "Add every item included in this receipt.",
                    "මෙම රිසිට් එකට අදාළ සියලු භාණ්ඩ එක් කරන්න."
                  )}
                </p>
              </div>

              <button
                type="button"
                onClick={addItemRow}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-600 border border-slate-200/60 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{t(lang, "Add Item", "භාණ්ඩයක් එක් කරන්න")}</span>
              </button>
            </div>

            {/* ITEM ROWS LIST */}
            <div className="space-y-3">
              {itemRows.map((row, index) => (
                <div
                  key={row.rowId}
                  className="bg-slate-50/60 rounded-2xl border border-slate-200/80 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {t(lang, "Item", "භාණ්ඩය")} {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItemRow(row.rowId)}
                      disabled={itemRows.length === 1}
                      title={t(lang, "Remove item", "භාණ්ඩය ඉවත් කරන්න")}
                      className="w-7 h-7 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-200/60 transition-all cursor-pointer disabled:opacity-40 disabled:hover:bg-slate-100 disabled:hover:text-slate-400 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                    {/* Item Picker */}
                    <div className="lg:col-span-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t(lang, "Item", "භාණ්ඩය")}
                        <span className="text-rose-500"> *</span>
                      </label>
                      <select
                        value={row.item_id === "" ? "" : String(row.item_id)}
                        disabled={loadingItems}
                        onChange={(event) =>
                          updateItemRow(row.rowId, "item_id", event.target.value)
                        }
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all cursor-pointer"
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
                                ? t(
                                    lang,
                                    " (Already selected)",
                                    " (දැනටමත් තෝරා ඇත)"
                                  )
                                : ""}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Quantity Received */}
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {t(lang, "Quantity Received", "ලැබුණු ප්‍රමාණය")}
                        <span className="text-rose-500"> *</span>
                      </label>
                      <input
                        ref={(el) => {
                          quantityInputRefs.current[row.rowId] = el;
                        }}
                        type="number"
                        min="1"
                        step="1"
                        value={row.quantity_received}
                        onChange={(event) =>
                          updateItemRow(
                            row.rowId,
                            "quantity_received",
                            event.target.value
                          )
                        }
                        placeholder="0"
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    {/* Unit Cost */}
                    <div className="lg:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
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
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-mono font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
                      />
                    </div>

                    {/* Remarks */}
                    <div className="lg:col-span-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
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
                          "අවශ්‍ය නම් සටහන්"
                        )}
                        className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FINANCIAL SUMMARY CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t(lang, "Item Rows", "භාණ්ඩ පේළි")}
              </p>
              <p className="mt-1 text-base font-extrabold font-mono text-slate-900">
                {itemRows.length}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t(lang, "Total Quantity", "මුළු ප්‍රමාණය")}
              </p>
              <p className="mt-1 text-base font-extrabold font-mono text-slate-900">
                {totalQuantity}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t(lang, "Subtotal", "උප එකතුව")}
              </p>
              <p className="mt-1 text-base font-extrabold font-mono text-slate-900">
                Rs.{" "}
                {totalValue.toLocaleString("en-LK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {t(lang, "VAT", "VAT")} ({currentVatPercentage}%)
              </p>
              <p className="mt-1 text-base font-extrabold font-mono text-slate-900">
                Rs.{" "}
                {vatAmount.toLocaleString("en-LK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                {t(lang, "Est. Total (incl. VAT)", "ඇස්. එකතුව (VAT සමඟ)")}
              </p>
              <p className="mt-1 text-base font-extrabold font-mono text-blue-600">
                Rs.{" "}
                {totalWithVat.toLocaleString("en-LK", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          {/* FORM ACTIONS */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={closeForm}
              disabled={submitting}
              className="w-full sm:w-auto h-10 px-5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {t(lang, "Cancel", "අවලංගු")}
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full sm:w-auto h-10 px-6 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t(lang, "Saving…", "සුරකිමින්…")}</span>
                </>
              ) : (
                <span>{t(lang, "Save Stock Receipt", "තොග රිසිට් සුරකින්න")}</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}