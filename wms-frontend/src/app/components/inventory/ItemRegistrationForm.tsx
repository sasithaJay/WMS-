import { useEffect, useState } from "react";
import { X } from "lucide-react";

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
  const [form, setForm] =
    useState<FormState>(initialForm);

  const [categories, setCategories] =
    useState<ItemCategory[]>([]);

  const [units, setUnits] =
    useState<Unit[]>([]);

  const [submitting, setSubmitting] =
    useState(false);

  const [loadingOptions, setLoadingOptions] =
    useState(true);

  const [error, setError] = useState("");

  const isEditing = item !== null;

  useEffect(() => {
    async function loadLookups() {
      try {
        setLoadingOptions(true);

        const [categoryData, unitData] =
          await Promise.all([
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
            "ප්‍රවර්ග සහ ඒකක පූරණය අසාර්ථක විය.",
          ),
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
        category_id: String(
          item.category_id ?? item.category.id,
        ),
        item_code: item.item_code,
        unit_id: String(
          item.unit_id ?? item.unit.id,
        ),
        reorder_level: String(
          item.reorder_level,
        ),
        description: item.description ?? "",
        reason: "",
      });

      return;
    }

    setForm(initialForm);
  }, [item]);

  function updateField(
    field: keyof FormState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
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
            : "අවශ්‍ය සියලු ක්ෂේත්‍ර සම්පූර්ණ කරන්න.",
        ),
      );

      return;
    }

    const reorderLevel = Number(
      form.reorder_level,
    );

    if (
      Number.isNaN(reorderLevel) ||
      reorderLevel < 0
    ) {
      setError(
        t(
          lang,
          "Reorder level must be zero or greater.",
          "නැවත ඇණවුම් මට්ටම ශුන්‍ය හෝ ඊට වැඩි විය යුතුය.",
        ),
      );

      return;
    }

    try {
      setSubmitting(true);

      // No barcode field sent — backend auto-generates/syncs it from item_code.
      const payload = {
        name_en: form.name_en.trim(),
        item_code: form.item_code.trim(),
        category_id: Number(form.category_id),
        unit_id: Number(form.unit_id),
        reorder_level: reorderLevel,
        description:
          form.description.trim() || undefined,
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

      const errorMessage =
        getErrorMessage(submitError);

      setError(
        errorMessage ??
          t(
            lang,
            isEditing
              ? "Failed to submit item update request."
              : "Failed to create item.",
            isEditing
              ? "භාණ්ඩ යාවත්කාලීන ඉල්ලීම යොමු කිරීම අසාර්ථක විය."
              : "භාණ්ඩය නිර්මාණය කිරීම අසාර්ථක විය.",
          ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4 py-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 z-10 bg-white flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">
            {isEditing
              ? t(
                  lang,
                  "Request Item Update",
                  "භාණ්ඩ යාවත්කාලීන ඉල්ලීම",
                )
              : t(
                  lang,
                  "Add New Item",
                  "නව භාණ්ඩ එකතු කරන්න",
                )}
          </h3>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {isEditing && (
              <div className="rounded-xl bg-blue-50 border border-blue-200 px-4 py-3 text-sm text-blue-700">
                {t(
                  lang,
                  "The item will not change immediately. AO approval is required.",
                  "භාණ්ඩ විස්තර වහාම වෙනස් නොවේ. පරිපාලන නිලධාරී අනුමැතිය අවශ්‍ය වේ.",
                )}
              </div>
            )}

            <FormInput
              label={t(
                lang,
                "Item Name",
                "භාණ්ඩ නාමය",
              )}
              value={form.name_en}
              onChange={(value) =>
                updateField("name_en", value)
              }
              disabled={submitting}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t(
                  lang,
                  "Item Code",
                  "භාණ්ඩ කේතය",
                )}
                <span className="text-red-500"> *</span>
              </label>

              <FormInput
                label=""
                value={form.item_code}
                onChange={(value) =>
                  updateField("item_code", value)
                }
                disabled={submitting}
              />

              <p className="mt-1.5 text-xs text-gray-400">
                {t(
                  lang,
                  "The QR code and barcode will be generated automatically from this code — you can print labels after saving.",
                  "QR කේතය සහ බාර්කේතය මෙම කේතයෙන් ස්වයංක්‍රීයව ජනනය වේ — සුරැකීමෙන් පසු ලේබල් මුද්‍රණය කළ හැක.",
                )}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t(
                  lang,
                  "Category",
                  "ප්‍රවර්ගය",
                )}
                <span className="text-red-500">
                  {" "}
                  *
                </span>
              </label>

              <select
                value={form.category_id}
                disabled={
                  loadingOptions || submitting
                }
                onChange={(event) =>
                  updateField(
                    "category_id",
                    event.target.value,
                  )
                }
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white disabled:opacity-60"
              >
                <option value="">
                  {loadingOptions
                    ? t(
                        lang,
                        "Loading categories...",
                        "ප්‍රවර්ග පූරණය වෙමින්...",
                      )
                    : t(
                        lang,
                        "Select a category",
                        "ප්‍රවර්ගයක් තෝරන්න",
                      )}
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {lang === "si" &&
                    category.name_si
                      ? category.name_si
                      : category.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t(lang, "Unit", "ඒකකය")}
                <span className="text-red-500">
                  {" "}
                  *
                </span>
              </label>

              <select
                value={form.unit_id}
                disabled={
                  loadingOptions || submitting
                }
                onChange={(event) =>
                  updateField(
                    "unit_id",
                    event.target.value,
                  )
                }
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white disabled:opacity-60"
              >
                <option value="">
                  {loadingOptions
                    ? t(
                        lang,
                        "Loading units...",
                        "ඒකක පූරණය වෙමින්...",
                      )
                    : t(
                        lang,
                        "Select a unit",
                        "ඒකකයක් තෝරන්න",
                      )}
                </option>

                {units.map((unit) => (
                  <option
                    key={unit.id}
                    value={unit.id}
                  >
                    {lang === "si" &&
                    unit.name_si
                      ? unit.name_si
                      : unit.name_en}
                  </option>
                ))}
              </select>
            </div>

            <FormInput
              label={t(
                lang,
                "Reorder Level",
                "නැවත ඇණවුම් මට්ටම",
              )}
              type="number"
              min="0"
              value={form.reorder_level}
              onChange={(value) =>
                updateField(
                  "reorder_level",
                  value,
                )
              }
              disabled={submitting}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t(
                  lang,
                  "Description",
                  "විස්තරය",
                )}
              </label>

              <textarea
                rows={3}
                value={form.description}
                disabled={submitting}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value,
                  )
                }
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white resize-none disabled:opacity-60"
              />
            </div>

            {isEditing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t(
                    lang,
                    "Reason for Update",
                    "යාවත්කාලීන කිරීමේ හේතුව",
                  )}
                  <span className="text-red-500">
                    {" "}
                    *
                  </span>
                </label>

                <textarea
                  rows={3}
                  value={form.reason}
                  disabled={submitting}
                  onChange={(event) =>
                    updateField(
                      "reason",
                      event.target.value,
                    )
                  }
                  placeholder={t(
                    lang,
                    "Explain why these item details need to be changed.",
                    "මෙම භාණ්ඩ විස්තර වෙනස් කළ යුත්තේ ඇයිද පැහැදිලි කරන්න.",
                  )}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white resize-none disabled:opacity-60"
                />
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-white flex gap-3 px-6 py-5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              {t(
                lang,
                "Cancel",
                "අවලංගු",
              )}
            </button>

            <button
              type="submit"
              disabled={
                submitting || loadingOptions
              }
              className="flex-1 py-2.5 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? isEditing
                  ? t(
                      lang,
                      "Submitting...",
                      "යොමු කරමින්...",
                    )
                  : t(
                      lang,
                      "Adding...",
                      "එකතු කරමින්...",
                    )
                : isEditing
                  ? t(
                      lang,
                      "Submit for Approval",
                      "අනුමැතිය සඳහා යොමු කරන්න",
                    )
                  : t(
                      lang,
                      "Add Item",
                      "භාණ්ඩ එකතු කරන්න",
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
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}

          {required && (
            <span className="text-red-500">
              {" "}
              *
            </span>
          )}
        </label>
      )}

      <input
        type={type}
        min={min}
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white disabled:opacity-60"
      />
    </div>
  );
}

function getErrorMessage(
  error: unknown,
): string | null {
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

  const validationErrors =
    response?.data?.errors;

  if (validationErrors) {
    return Object.values(validationErrors)
      .flat()
      .join(" ");
  }

  return response?.data?.message ?? null;
}