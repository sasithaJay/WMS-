import { useEffect, useState } from "react";
import { X, AlertCircle, Info, Loader2, Plus } from "lucide-react";

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
  createSecondaryCategory,
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
  const [mainCategoryId, setMainCategoryId] = useState("");
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [savingCategory, setSavingCategory] = useState(false);

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
            "à¶´à·Šâ€à¶»à·€à¶»à·Šà¶œ à·ƒà·„ à¶’à¶šà¶š à¶´à·–à¶»à¶«à¶º à¶…à·ƒà·à¶»à·Šà¶®à¶š à·€à·’à¶º."
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
      const existingCategoryId = item.category_id ?? item.category.id;
      setMainCategoryId(String(item.category.parent_category_id ?? existingCategoryId));
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

    setMainCategoryId("");
    setForm(initialForm);
  }, [item]);

  const mainCategories = categories.filter((category) => !category.parent_category_id);
  const secondaryCategories = categories.filter((category) => category.parent_category_id === Number(mainCategoryId));

  async function handleCreateCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCategoryError("");
    const normalizedName = categoryName.trim().replace(/\s+/g, " ");
    if (normalizedName.length < 2 || normalizedName.length > 100) {
      setCategoryError("Enter a category name between 2 and 100 characters.");
      return;
    }
    if (categoryDescription.length > 500) {
      setCategoryError("Description must be 500 characters or fewer.");
      return;
    }
    try {
      setSavingCategory(true);
      const created = await createSecondaryCategory({
        main_category_id: Number(mainCategoryId),
        name: normalizedName,
        description: categoryDescription.trim() || undefined,
      });
      setCategories((current) => [...current.filter((category) => category.id !== created.id), created]);
      setMainCategoryId(String(created.parent_category_id));
      setForm((current) => ({ ...current, category_id: String(created.id) }));
      setCategoryName("");
      setCategoryDescription("");
      setCategoryModalOpen(false);
      void getItemCategories().then(setCategories).catch((refreshError) => console.error(refreshError));
    } catch (categorySubmitError) {
      setCategoryError(getErrorMessage(categorySubmitError) ?? "Failed to create the category. Please try again.");
    } finally {
      setSavingCategory(false);
    }
  }

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
            ? "à¶…à·€à·à·Šâ€à¶º à¶šà·Šà·‚à·šà¶­à·Šâ€à¶» à·ƒà¶¸à·Šà¶´à·–à¶»à·Šà¶« à¶šà¶» à·„à·šà¶­à·”à·€ à·ƒà¶³à·„à¶±à·Š à¶šà¶»à¶±à·Šà¶±."
            : "à¶…à·€à·à·Šâ€à¶º à·ƒà·’à¶ºà¶½à·” à¶šà·Šà·‚à·šà¶­à·Šâ€à¶» à·ƒà¶¸à·Šà¶´à·–à¶»à·Šà¶« à¶šà¶»à¶±à·Šà¶±."
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
          "à¶±à·à·€à¶­ à¶‡à¶«à·€à·”à¶¸à·Š à¶¸à¶§à·Šà¶§à¶¸ à·à·”à¶±à·Šâ€à¶º à·„à· à¶Šà¶§ à·€à·à¶©à·’ à·€à·’à¶º à¶ºà·”à¶­à·”à¶º."
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
              ? "à¶·à·à¶«à·Šà¶© à¶ºà·à·€à¶­à·Šà¶šà·à¶½à·“à¶± à¶‰à¶½à·Šà¶½à·“à¶¸ à¶ºà·œà¶¸à·” à¶šà·’à¶»à·“à¶¸ à¶…à·ƒà·à¶»à·Šà¶®à¶š à·€à·’à¶º."
              : "à¶·à·à¶«à·Šà¶©à¶º à¶±à·’à¶»à·Šà¶¸à·à¶«à¶º à¶šà·’à¶»à·“à¶¸ à¶…à·ƒà·à¶»à·Šà¶®à¶š à·€à·’à¶º."
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
              ? t(lang, "Request Item Update", "à¶·à·à¶«à·Šà¶© à¶ºà·à·€à¶­à·Šà¶šà·à¶½à·“à¶± à¶‰à¶½à·Šà¶½à·“à¶¸")
              : t(lang, "Add New Item", "à¶±à·€ à¶·à·à¶«à·Šà¶© à¶‘à¶šà¶­à·” à¶šà¶»à¶±à·Šà¶±")}
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
                    "à¶·à·à¶«à·Šà¶© à·€à·’à·ƒà·Šà¶­à¶» à·€à·„à·à¶¸ à·€à·™à¶±à·ƒà·Š à¶±à·œà·€à·š. à¶´à¶»à·’à¶´à·à¶½à¶± à¶±à·’à¶½à¶°à·à¶»à·“ à¶…à¶±à·”à¶¸à·à¶­à·’à¶º à¶…à·€à·à·Šâ€à¶º à·€à·š."
                  )}
                </span>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">{t(lang, "Main Category", "à¶´à·Šâ€à¶»à¶°à·à¶± à¶´à·Šâ€à¶»à·€à¶»à·Šà¶œà¶º")} <span className="text-rose-500">*</span></label>
              <select value={mainCategoryId} disabled={loadingOptions || submitting} onChange={(event) => { setMainCategoryId(event.target.value); updateField("category_id", ""); }} className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900">
                <option value="">{t(lang, "Select a main category", "à¶´à·Šâ€à¶»à¶°à·à¶± à¶´à·Šâ€à¶»à·€à¶»à·Šà¶œà¶ºà¶šà·Š à¶­à·à¶»à¶±à·Šà¶±")}</option>
                {mainCategories.map((category) => <option key={category.id} value={category.id}>{lang === "si" && category.name_si ? category.name_si : category.name_en}</option>)}
              </select>
              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between"><label className="block text-xs font-bold text-slate-700">{t(lang, "Secondary Category", "à¶¯à·Šà·€à·’à¶­à·’à¶ºà·’à¶š à¶´à·Šâ€à¶»à·€à¶»à·Šà¶œà¶º")} <span className="text-rose-500">*</span></label><button type="button" disabled={!mainCategoryId || loadingOptions || submitting} onClick={() => { setCategoryError(""); setCategoryModalOpen(true); }} className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 disabled:text-slate-400"><Plus className="h-3.5 w-3.5" /> {t(lang, "Add New", "à¶…à¶½à·”à¶­à·’à¶±à·Š à¶‘à¶šà·Š à¶šà¶»à¶±à·Šà¶±")}</button></div>
                <select value={form.category_id} disabled={loadingOptions || submitting || !mainCategoryId} onChange={(event) => updateField("category_id", event.target.value)} className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-60 cursor-pointer">
                  <option value="">{t(lang, "Select a secondary category", "à¶¯à·Šà·€à·’à¶­à·’à¶ºà·’à¶š à¶´à·Šâ€à¶»à·€à¶»à·Šà¶œà¶ºà¶šà·Š à¶­à·à¶»à¶±à·Šà¶±")}</option>
                  {isEditing && mainCategoryId && form.category_id === mainCategoryId && <option value={mainCategoryId}>Existing main category</option>}
                  {secondaryCategories.map((category) => <option key={category.id} value={category.id}>{lang === "si" && category.name_si ? category.name_si : category.name_en}</option>)}
                </select>
              </div>
            </div>

            <FormInput
              label={t(lang, "Item Name", "à¶·à·à¶«à·Šà¶© à¶±à·à¶¸à¶º")}
              value={form.name_en}
              onChange={(value) => updateField("name_en", value)}
              disabled={submitting}
              required
            />

            <div>
              <FormInput
                label={t(lang, "Item Code", "à¶·à·à¶«à·Šà¶© à¶šà·šà¶­à¶º")}
                value={form.item_code}
                onChange={(value) => updateField("item_code", value)}
                disabled={submitting}
                required
              />

              <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                {t(
                  lang,
                  "The QR code and barcode will be generated automatically from this code â€” you can print labels after saving.",
                  "QR à¶šà·šà¶­à¶º à·ƒà·„ à¶¶à·à¶»à·Šà¶šà·šà¶­à¶º à¶¸à·™à¶¸ à¶šà·šà¶­à¶ºà·™à¶±à·Š à·ƒà·Šà·€à¶ºà¶‚à¶šà·Šâ€à¶»à·“à¶ºà·€ à¶¢à¶±à¶±à¶º à·€à·š â€” à·ƒà·”à¶»à·à¶šà·“à¶¸à·™à¶±à·Š à¶´à·ƒà·” à¶½à·šà¶¶à¶½à·Š à¶¸à·”à¶¯à·Šâ€à¶»à¶«à¶º à¶šà·… à·„à·à¶š."
                )}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t(lang, "Unit", "à¶’à¶šà¶šà¶º")}
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
                    ? t(lang, "Loading units...", "à¶’à¶šà¶š à¶´à·–à¶»à¶«à¶º à·€à·™à¶¸à·’à¶±à·Š...")
                    : t(lang, "Select a unit", "à¶’à¶šà¶šà¶ºà¶šà·Š à¶­à·à¶»à¶±à·Šà¶±")}
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
              label={t(lang, "Reorder Level", "à¶±à·à·€à¶­ à¶‡à¶«à·€à·”à¶¸à·Š à¶¸à¶§à·Šà¶§à¶¸")}
              type="number"
              min="0"
              value={form.reorder_level}
              onChange={(value) => updateField("reorder_level", value)}
              disabled={submitting}
              required
            />

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t(lang, "Description", "à·€à·’à·ƒà·Šà¶­à¶»à¶º")}
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
                  {t(lang, "Reason for Update", "à¶ºà·à·€à¶­à·Šà¶šà·à¶½à·“à¶± à¶šà·’à¶»à·“à¶¸à·š à·„à·šà¶­à·”à·€")}
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
                    "à¶¸à·™à¶¸ à¶·à·à¶«à·Šà¶© à·€à·’à·ƒà·Šà¶­à¶» à·€à·™à¶±à·ƒà·Š à¶šà·… à¶ºà·”à¶­à·Šà¶­à·š à¶‡à¶ºà·’à¶¯ à¶´à·à·„à·à¶¯à·’à¶½à·’ à¶šà¶»à¶±à·Šà¶±."
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
              {t(lang, "Cancel", "à¶…à·€à¶½à¶‚à¶œà·”")}
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
                      ? t(lang, "Submitting...", "à¶ºà·œà¶¸à·” à¶šà¶»à¶¸à·’à¶±à·Š...")
                      : t(lang, "Adding...", "à¶‘à¶šà¶­à·” à¶šà¶»à¶¸à·’à¶±à·Š...")}
                  </span>
                </>
              ) : (
                <span>
                  {isEditing
                    ? t(lang, "Submit for Approval", "à¶…à¶±à·”à¶¸à·à¶­à·’à¶º à·ƒà¶³à·„à· à¶ºà·œà¶¸à·” à¶šà¶»à¶±à·Šà¶±")
                    : t(lang, "Add Item", "à¶·à·à¶«à·Šà¶© à¶‘à¶šà¶­à·” à¶šà¶»à¶±à·Šà¶±")}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
      {categoryModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="presentation">
          <button type="button" aria-label="Close dialog" onClick={() => !savingCategory && setCategoryModalOpen(false)} className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />
          <section role="dialog" aria-modal="true" aria-labelledby="secondary-category-title" className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
              <div>
                <h2 id="secondary-category-title" className="text-base font-bold text-slate-900">Add Secondary Category</h2>
                <p className="mt-1 text-xs text-slate-500">Create a category for organizing warehouse inventory.</p>
              </div>
              <button type="button" disabled={savingCategory} aria-label="Close" onClick={() => setCategoryModalOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X className="h-4 w-4" /></button>
            </header>
            <form onSubmit={handleCreateCategory}>
              <div className="space-y-4 px-5 py-4">
                {categoryError && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">{categoryError}</div>}
                <div>
                  <label htmlFor="secondary-main-category" className="mb-1.5 block text-xs font-bold text-slate-700">Main Category <span className="text-rose-500">*</span></label>
                  <select id="secondary-main-category" value={mainCategoryId} disabled className="w-full h-10 rounded-xl border border-slate-200 bg-slate-100 px-3 text-sm text-slate-700">
                    {mainCategories.filter((category) => String(category.id) === mainCategoryId).map((category) => <option key={category.id} value={category.id}>{category.name_en}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="secondary-category-name" className="mb-1.5 block text-xs font-bold text-slate-700">Secondary Category Name <span className="text-rose-500">*</span></label>
                  <input id="secondary-category-name" autoFocus maxLength={100} required value={categoryName} onChange={(event) => setCategoryName(event.target.value)} placeholder="e.g. Pens, Papers, CR Books" disabled={savingCategory} className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                  <p className="mt-1 text-[11px] text-slate-400">{categoryName.length}/100 characters</p>
                </div>
                <div>
                  <label htmlFor="secondary-category-description" className="mb-1.5 block text-xs font-bold text-slate-700">Description</label>
                  <textarea id="secondary-category-description" maxLength={500} rows={3} value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} placeholder="Optional description of this category" disabled={savingCategory} className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" />
                </div>
              </div>
              <footer className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4">
                <button type="button" disabled={savingCategory} onClick={() => setCategoryModalOpen(false)} className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-700 hover:bg-white disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={savingCategory} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50">
                  {savingCategory && <Loader2 className="h-4 w-4 animate-spin" />}{savingCategory ? "Saving..." : "Save Category"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
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
