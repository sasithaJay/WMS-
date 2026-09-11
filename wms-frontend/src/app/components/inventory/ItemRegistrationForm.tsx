import { useEffect, useState } from "react";
import { X, AlertCircle, Info, Loader2 } from "lucide-react";

import { t } from "../../constants/translations";

import type { Lang } from "../../types";

import type {
  InventoryItem,
  ItemCategory,
  Unit,
} from "../../types/inventory";

import {
  createItem,
  requestItemUpdate,
  getItemCategories,
  getUnits,
} from "../../../services/ItemService";

interface ItemRegistrationFormProps {
  lang: Lang;
  item: InventoryItem | null;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

interface FormState {
  name_en: string;
  category_id: string;
  item_code: string;
  unit_id: string;
  reorder_level: string;
  description: string;
  reason: string;
}

const initialForm: FormState = {
  name_en: "",
  category_id: "",
  item_code: "",
  unit_id: "",
  reorder_level: "",
  description: "",
  reason: "",
};

export function ItemRegistrationForm({
  lang,
  item,
  onClose,
  onSaved,
}: ItemRegistrationFormProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState("");

  const isEditing = item !== null;

  useEffect(() => {
    async function loadLookups() {
      try {
        setLoadingOptions(true);

        const [categoryData, unitData] = await Promise.all([
          getItemCategories(),
          getUnits(),
        ]);

        setCategories(categoryData);
        setUnits(unitData);
      } catch (loadError) {
        console.error(loadError);

        setError(
          t(
            lang,
            "Failed to load categories and units.",
            "ප්‍රවර්ග සහ ඒකක පූරණය අසාර්ථක විය."
          )
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    void loadLookups();
  }, [lang]);

  useEffect(() => {
    if (item) {
      setForm({
        name_en: item.name_en,
        category_id: String(item.category_id ?? item.category.id),
        item_code: item.item_code,
        unit_id: String(item.unit_id ?? item.unit.id),
        reorder_level: String(item.reorder_level),
        description: item.description ?? "",
        reason: "",
      });

      return;
    }

    setForm(initialForm);
  }, [item]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (
      !form.name_en.trim() ||
      !form.item_code.trim() ||
      !form.category_id ||
      !form.unit_id ||
      form.reorder_level === "" ||
      (isEditing && !form.reason.trim())
    ) {
      setError(
        t(
          lang,
          isEditing
            ? "Complete all required fields and provide a reason."
            : "Please complete all required fields.",
          isEditing
            ? "අවශ්‍ය ක්ෂේත්‍ර සම්පූර්ණ කර හේතුව සඳහන් කරන්න."
            : "අවශ්‍ය සියලු ක්ෂේත්‍ර සම්පූර්ණ කරන්න."
        )
      );

      return;
    }

    const reorderLevel = Number(form.reorder_level);

    if (Number.isNaN(reorderLevel) || reorderLevel < 0) {
      setError(
        t(
          lang,
          "Reorder level must be zero or greater.",
          "නැවත ඇණවුම් මට්ටම ශුන්‍ය හෝ ඊට වැඩි විය යුතුය."
        )
      );

      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        name_en: form.name_en.trim(),
        item_code: form.item_code.trim(),
        category_id: Number(form.category_id),
        unit_id: Number(form.unit_id),
        reorder_level: reorderLevel,
        description: form.description.trim() || undefined,
      };

      if (item) {
        await requestItemUpdate(item.id, {
          ...payload,
          reason: form.reason.trim(),
        });
      } else {
        await createItem(payload);
      }

      await onSaved();
    } catch (submitError: unknown) {
      console.error(submitError);

      const errorMessage = getErrorMessage(submitError);

      setError(
        errorMessage ??
          t(
            lang,
            isEditing
              ? "Failed to submit item update request."
              : "Failed to create item.",
            isEditing
              ? "භාණ්ඩ යාවත්කාලීන ඉල්ලීම යොමු කිරීම අසාර්ථක විය."
              : "භාණ්ඩය නිර්මාණය කිරීම අසාර්ථක විය."
          )
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Blurred Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Modal Dialog Container */}
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden z-10 my-auto">
        {/* Sticky Header */}
        <div className="sticky top-0 z-10 bg-slate-50/80 backdrop-blur-md flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">
            {isEditing
              ? t(lang, "Request Item Update", "භාණ්ඩ යාවත්කාලීන ඉල්ලීම")
              : t(lang, "Add New Item", "නව භාණ්ඩ එකතු කරන්න")}
          </h3>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-500 hover:text-slate-900 transition-all flex items-center justify-center cursor-pointer shrink-0 disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="p-5 sm:p-6 space-y-4">
            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {isEditing && (
              <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl px-4 py-3 text-xs text-blue-800 font-medium flex items-start gap-2.5 shadow-2xs">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  {t(
                    lang,
                    "The item will not change immediately. AO approval is required.",
                    "භාණ්ඩ විස්තර වහාම වෙනස් නොවේ. පරිපාලන නිලධාරී අනුමැතිය අවශ්‍ය වේ."
                  )}
                </span>
              </div>
            )}

            <FormInput
              label={t(lang, "Item Name", "භාණ්ඩ නාමය")}
              value={form.name_en}
              onChange={(value) => updateField("name_en", value)}
              disabled={submitting}
              required
            />

            <div>
              <FormInput
                label={t(lang, "Item Code", "භාණ්ඩ කේතය")}
                value={form.item_code}
                onChange={(value) => updateField("item_code", value)}
                disabled={submitting}
                required
              />

              <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                {t(
                  lang,
                  "The QR code and barcode will be generated automatically from this code — you can print labels after saving.",
                  "QR කේතය සහ බාර්කේතය මෙම කේතයෙන් ස්වයංක්‍රීයව ජනනය වේ — සුරැකීමෙන් පසු ලේබල් මුද්‍රණය කළ හැක."
                )}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t(lang, "Category", "ප්‍රවර්ගය")}
                <span className="text-rose-500"> *</span>
              </label>

              <select
                value={form.category_id}
                disabled={loadingOptions || submitting}
                onChange={(event) => updateField("category_id", event.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-60 cursor-pointer"
              >
                <option value="">
                  {loadingOptions
                    ? t(lang, "Loading categories...", "ප්‍රවර්ග පූරණය වෙමින්...")
                    : t(lang, "Select a category", "ප්‍රවර්ගයක් තෝරන්න")}
                </option>

                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {lang === "si" && category.name_si
                      ? category.name_si
                      : category.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t(lang, "Unit", "ඒකකය")}
                <span className="text-rose-500"> *</span>
              </label>

              <select
                value={form.unit_id}
                disabled={loadingOptions || submitting}
                onChange={(event) => updateField("unit_id", event.target.value)}
                className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-60 cursor-pointer"
              >
                <option value="">
                  {loadingOptions
                    ? t(lang, "Loading units...", "ඒකක පූරණය වෙමින්...")
                    : t(lang, "Select a unit", "ඒකකයක් තෝරන්න")}
                </option>

                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {lang === "si" && unit.name_si
                      ? unit.name_si
                      : unit.name_en}
                  </option>
                ))}
              </select>
            </div>

            <FormInput
              label={t(lang, "Reorder Level", "නැවත ඇණවුම් මට්ටම")}
              type="number"
              min="0"
              value={form.reorder_level}
              onChange={(value) => updateField("reorder_level", value)}
              disabled={submitting}
              required
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t(lang, "Description", "විස්තරය")}
              </label>

              <textarea
                rows={3}
                value={form.description}
                disabled={submitting}
                onChange={(event) => updateField("description", event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none disabled:opacity-60 placeholder:text-slate-400"
              />
            </div>

            {isEditing && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  {t(lang, "Reason for Update", "යාවත්කාලීන කිරීමේ හේතුව")}
                  <span className="text-rose-500"> *</span>
                </label>

                <textarea
                  rows={3}
                  value={form.reason}
                  disabled={submitting}
                  onChange={(event) => updateField("reason", event.target.value)}
                  placeholder={t(
                    lang,
                    "Explain why these item details need to be changed.",
                    "මෙම භාණ්ඩ විස්තර වෙනස් කළ යුත්තේ ඇයිද පැහැදිලි කරන්න."
                  )}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all resize-none disabled:opacity-60 placeholder:text-slate-400"
                />
              </div>
            )}
          </div>

          {/* Sticky Actions Footer */}
          <div className="sticky bottom-0 bg-slate-50/80 backdrop-blur-md flex items-center justify-end gap-2.5 px-5 py-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 sm:flex-initial h-10 px-5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
            >
              {t(lang, "Cancel", "අවලංගු")}
            </button>

            <button
              type="submit"
              disabled={submitting || loadingOptions}
              className="flex-1 sm:flex-initial h-10 px-6 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>
                    {isEditing
                      ? t(lang, "Submitting...", "යොමු කරමින්...")
                      : t(lang, "Adding...", "එකතු කරමින්...")}
                  </span>
                </>
              ) : (
                <span>
                  {isEditing
                    ? t(lang, "Submit for Approval", "අනුමැතිය සඳහා යොමු කරන්න")
                    : t(lang, "Add Item", "භාණ්ඩ එකතු කරන්න")}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  min?: string;
  required?: boolean;
  disabled?: boolean;
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  min,
  required = false,
  disabled = false,
}: FormInputProps) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-bold text-slate-700 mb-1.5">
          {label}
          {required && <span className="text-rose-500"> *</span>}
        </label>
      )}

      <input
        type={type}
        min={min}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-60"
      />
    </div>
  );
}

function getErrorMessage(error: unknown): string | null {
  if (
    typeof error !== "object" ||
    error === null ||
    !("response" in error)
  ) {
    return null;
  }

  const response = (
    error as {
      response?: {
        data?: {
          message?: string;
          errors?: Record<string, string[]>;
        };
      };
    }
  ).response;

  const validationErrors = response?.data?.errors;

  if (validationErrors) {
    return Object.values(validationErrors)
      .flat()
      .join(" ");
  }

  return response?.data?.message ?? null;
}