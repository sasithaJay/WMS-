import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type {
  ItemCategory,
  Unit,
} from "../../types/inventory";
import {
  createItem,
  getItemCategories,
  getUnits,
} from "../../../services/ItemService";

interface ItemRegistrationFormProps {
  lang: Lang;
  onClose: () => void;
  onCreated: () => Promise<void>;
}

interface FormState {
  name_en: string;
  name_si: string;
  category_id: string;
  item_code: string;
  unit_id: string;
  reorder_level: string;
  barcode: string;
  description: string;
}

const initialForm: FormState = {
  name_en: "",
  name_si: "",
  category_id: "",
  item_code: "",
  unit_id: "",
  reorder_level: "",
  barcode: "",
  description: "",
};

export function ItemRegistrationForm({
  lang,
  onClose,
  onCreated,
}: ItemRegistrationFormProps) {
  const [form, setForm] = useState<FormState>(initialForm);
  const [categories, setCategories] = useState<ItemCategory[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLookups() {
      try {
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
            "ප්‍රවර්ග සහ ඒකක පූරණය අසාර්ථක විය.",
          ),
        );
      }
    }

    void loadLookups();
  }, [lang]);

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
      !form.reorder_level
    ) {
      setError(
        t(
          lang,
          "Please complete all required fields.",
          "අවශ්‍ය සියලු ක්ෂේත්‍ර සම්පූර්ණ කරන්න.",
        ),
      );
      return;
    }

    try {
      setSubmitting(true);

      await createItem({
        division_id: 1,
        name_en: form.name_en.trim(),
        name_si: form.name_si.trim() || undefined,
        item_code: form.item_code.trim(),
        category_id: Number(form.category_id),
        unit_id: Number(form.unit_id),
        reorder_level: Number(form.reorder_level),
        barcode: form.barcode.trim() || undefined,
        description: form.description.trim() || undefined,
      });

      await onCreated();
      onClose();
    } catch (submitError: any) {
      console.error(submitError);

      setError(
        submitError.response?.data?.message ??
          t(
            lang,
            "Failed to create item.",
            "භාණ්ඩය නිර්මාණය අසාර්ථක විය.",
          ),
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4 py-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">
            {t(
              lang,
              "Add New Item",
              "නව භාණ්ඩ එකතු කරන්න",
            )}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
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

            <FormInput
              label={t(lang, "English Name", "ඉංග්‍රීසි නාමය")}
              value={form.name_en}
              onChange={(value) => updateField("name_en", value)}
              required
            />

            <FormInput
              label={t(lang, "Sinhala Name", "සිංහල නාමය")}
              value={form.name_si}
              onChange={(value) => updateField("name_si", value)}
            />

            <FormInput
              label={t(lang, "Item Code", "භාණ්ඩ කේතය")}
              value={form.item_code}
              onChange={(value) => updateField("item_code", value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t(lang, "Category", "ප්‍රවර්ගය")}
                <span className="text-red-500"> *</span>
              </label>

              <select
                value={form.category_id}
                onChange={(event) =>
                  updateField("category_id", event.target.value)
                }
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white"
              >
                <option value="">
                  {t(
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
                    {lang === "si" && category.name_si
                      ? category.name_si
                      : category.name_en}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t(lang, "Unit", "ඒකකය")}
                <span className="text-red-500"> *</span>
              </label>

              <select
                value={form.unit_id}
                onChange={(event) =>
                  updateField("unit_id", event.target.value)
                }
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white"
              >
                <option value="">
                  {t(
                    lang,
                    "Select a unit",
                    "ඒකකයක් තෝරන්න",
                  )}
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
              label={t(
                lang,
                "Reorder Level",
                "නැවත ඇණවුම් මට්ටම",
              )}
              type="number"
              min="0"
              value={form.reorder_level}
              onChange={(value) =>
                updateField("reorder_level", value)
              }
              required
            />

            <FormInput
              label={t(
                lang,
                "Barcode (optional)",
                "බාකෝඩය (අවශ්‍ය නම්)",
              )}
              value={form.barcode}
              onChange={(value) => updateField("barcode", value)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t(lang, "Description", "විස්තරය")}
              </label>

              <textarea
                rows={3}
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white resize-none"
              />
            </div>
          </div>

          <div className="sticky bottom-0 bg-white flex gap-3 px-6 py-5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50"
            >
              {t(lang, "Cancel", "අවලංගු")}
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting
                ? t(lang, "Adding...", "එකතු කරමින්...")
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
}

function FormInput({
  label,
  value,
  onChange,
  type = "text",
  min,
  required = false,
}: FormInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>

      <input
        type={type}
        min={min}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white"
      />
    </div>
  );
}