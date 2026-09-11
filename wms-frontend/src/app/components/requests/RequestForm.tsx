import { useEffect, useState } from "react";
import {
  PlusCircle,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Search,
  Building2,
  Trash2,
} from "lucide-react";
import { AxiosError } from "axios";

import { getItems } from "../../../services/ItemService";
import { createStockRequest } from "../../../services/stockRequestService";
import { getDsOffices, type DsOffice } from "../../../services/dsOfficeService";
import { t } from "../../constants/translations";
import type { Lang, Role } from "../../types";
import type {
  CreateStockRequestPayload,
  StockRequestContext,
} from "../../types/stockRequests";

interface Item {
  id: number;
  item_code: string;
  name_en: string;
  name_si?: string;
}

interface RequestRow {
  rowId: string;
  item_id: number | "";
  qty: number;
}

interface LaravelValidationErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

function createRowId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function RequestForm({
  lang,
  role,
  onCancel,
  onSubmitted,
}: {
  lang: Lang;
  role: Role;
  onCancel: () => void;
  onSubmitted?: () => void;
}) {
  const [reqType, setReqType] = useState<"personal" | "section" | "ds_office">(
    "personal"
  );
  const [rows, setRows] = useState<RequestRow[]>([
    { rowId: createRowId(), item_id: "", qty: 1 },
  ]);
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");

  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);

  const isFA = role === "SECTION_HEAD";
  const isCommissioner = role === "COMMISSIONER";
  const isAo = role === "ADMINISTRATIVE_OFFICER";

  const [selectedDivisionId, setSelectedDivisionId] = useState<number | "">("");

  // DS Office picker — only relevant for AO
  const [dsOffices, setDsOffices] = useState<DsOffice[]>([]);
  const [loadingDsOffices, setLoadingDsOffices] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<number | "">("");

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [dsSearch, setDsSearch] = useState("");
  const [showDsOptions, setShowDsOptions] = useState(false);

  const filteredDsOffices = dsOffices.filter((office) => {
    const s = dsSearch.toLowerCase().trim();
    return (
      office.name_en.toLowerCase().includes(s) ||
      office.name_si.includes(dsSearch) ||
      office.district.toLowerCase().includes(s)
    );
  });

  useEffect(() => {
    const handler = () => setShowDsOptions(false);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    if (isCommissioner && !selectedDivisionId) {
      setItems([]);
      return;
    }
    loadItems();
  }, [selectedDivisionId]);

  useEffect(() => {
    setRows([{ rowId: createRowId(), item_id: "", qty: 1 }]);
  }, [selectedDivisionId]);

  useEffect(() => {
    if (isAo && reqType === "ds_office") {
      loadDsOffices();
    }
  }, [reqType]);

  async function loadItems() {
    try {
      setLoadingItems(true);
      const response = await getItems({
        per_page: 500,
        ...(isCommissioner && selectedDivisionId
          ? { division_id: selectedDivisionId as number }
          : {}),
      });
      setItems(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  }

  async function loadDsOffices() {
    try {
      setLoadingDsOffices(true);
      const response = await getDsOffices();
      setDsOffices(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDsOffices(false);
    }
  }

  const filteredItems = items.filter(
    (it) =>
      it.name_en.toLowerCase().includes(search.toLowerCase()) ||
      it.item_code.toLowerCase().includes(search.toLowerCase())
  );

  const addRow = () =>
    setRows((r) => [...r, { rowId: createRowId(), item_id: "", qty: 1 }]);

  const removeRow = (rowId: string) =>
    setRows((r) => (r.length === 1 ? r : r.filter((row) => row.rowId !== rowId)));

  const setRow = (
    rowId: string,
    field: keyof Omit<RequestRow, "rowId">,
    val: string | number
  ) =>
    setRows((r) =>
      r.map((row) => (row.rowId === rowId ? { ...row, [field]: val } : row))
    );

  function applyServerErrors(errors: Record<string, string[]>) {
    const flat: Record<string, string> = {};
    Object.entries(errors).forEach(([key, msgs]) => {
      flat[key] = msgs[0];
    });
    setFieldErrors(flat);
    const first = Object.values(flat)[0];
    if (first) setError(first);
  }

  function validate(): string | null {
    if (isCommissioner && !selectedDivisionId) {
      return t(lang, "Please select a store/division.", "කරුණාකර ගබඩාව තෝරන්න.");
    }
    if (isAo && reqType === "ds_office" && !selectedOrgId) {
      return t(
        lang,
        "Please select a Divisional Secretary Office.",
        "කරුණාකර ප්‍රාදේශීය ලේකම් කාර්යාලය තෝරන්න."
      );
    }
    if (rows.some((r) => r.item_id === "")) {
      return t(lang, "Select an item in every row.", "සෑම පේළියකටම භාණ්ඩයක් තෝරන්න.");
    }
    const ids = rows.map((r) => r.item_id).filter((v) => v !== "");
    if (new Set(ids).size !== ids.length) {
      return t(lang, "The same item cannot be added twice.", "එකම භාණ්ඩය දෙවතාවක් එකතු කළ නොහැක.");
    }
    if (rows.some((r) => !r.qty || r.qty <= 0)) {
      return t(lang, "Quantity must be greater than zero.", "ප්‍රමාණය ශුන්‍යයට වඩා වැඩි විය යුතුය.");
    }
    return null;
  }

  async function handleSubmit() {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const context: StockRequestContext =
      isAo && reqType === "ds_office"
        ? "DS_OFFICE"
        : isFA && reqType === "section"
        ? "SECTION_COMMON"
        : "PERSONAL";

    const payload: CreateStockRequestPayload = {
      request_context: context,
      notes: notes.trim() || undefined,
      items: rows.map((r) => ({
        item_id: r.item_id as number,
        quantity_requested: r.qty,
      })),
      ...(isCommissioner && selectedDivisionId
        ? { division_id: selectedDivisionId as number }
        : {}),
      ...(context === "DS_OFFICE" && selectedOrgId
        ? { ds_office_id: selectedOrgId as number }
        : {}),
    };

    try {
      setSubmitting(true);
      setError("");
      setFieldErrors({});
      setSuccessMessage("");

      const request = await createStockRequest(payload);

      setSuccessMessage(
        t(
          lang,
          `Request ${request.request_number} submitted.`,
          `ඉල්ලීම ${request.request_number} ඉදිරිපත් කරන ලදී.`
        )
      );

      onSubmitted?.();

      window.setTimeout(() => {
        onCancel();
      }, 1200);
    } catch (err) {
      const axiosErr = err as AxiosError<LaravelValidationErrorBody>;

      if (axiosErr.response?.status === 422 && axiosErr.response.data.errors) {
        applyServerErrors(axiosErr.response.data.errors);
      } else if (axiosErr.response?.status === 403) {
        setError(
          t(
            lang,
            "You are not permitted to submit this request.",
            "මෙම ඉල්ලීම ඉදිරිපත් කිරීමට ඔබට අවසර නැත."
          )
        );
      } else {
        console.error(err);
        setError(
          t(
            lang,
            "Unable to submit the request. Please try again.",
            "ඉල්ලීම ඉදිරිපත් කළ නොහැක. නැවත උත්සාහ කරන්න."
          )
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5">
      {/* REQUEST TYPE TABS */}
      {isFA && (
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 overflow-x-auto no-scrollbar w-full sm:w-fit">
          {(["personal", "section"] as const).map((tb) => (
            <button
              key={tb}
              type="button"
              onClick={() => setReqType(tb)}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                reqType === tb
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tb === "personal"
                ? t(lang, "Personal Request", "පෞද්ගලික ඉල්ලීම")
                : t(lang, "Section Request (Common Use)", "අංශ ඉල්ලීම")}
            </button>
          ))}
        </div>
      )}

      {isAo && (
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60 overflow-x-auto no-scrollbar w-full sm:w-fit">
          {(["personal", "ds_office"] as const).map((tb) => (
            <button
              key={tb}
              type="button"
              onClick={() => setReqType(tb)}
              className={`flex-1 sm:flex-initial px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                reqType === tb
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tb === "personal"
                ? t(lang, "Personal Request", "පෞද්ගලික ඉල්ලීම")
                : t(lang, "DS Office Request", "ප්‍රාදේශීය ලේකම් කාර්යාල ඉල්ලීම")}
            </button>
          ))}
        </div>
      )}

      {/* CONTEXT ALERT */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl px-4 py-3 text-xs text-blue-800 font-medium flex items-center gap-2.5 shadow-2xs">
        <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
        <span>
          {reqType === "ds_office"
            ? t(
                lang,
                "Each Divisional Secretary Office may submit one request per year.",
                "එක් එක් ප්‍රාදේශීය ලේකම් කාර්යාලයට වසරකට එක් ඉල්ලීමක් ඉදිරිපත් කළ හැක."
              )
            : t(
                lang,
                "You may submit one personal request per month.",
                "ඔබට මසකට පෞද්ගලික ඉල්ලීමක් ඉදිරිපත් කළ හැකිය."
              )}
        </span>
      </div>

      {/* ERROR / SUCCESS NOTIFICATIONS */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700">
          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* MAIN FORM CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-5">
        <h3 className="font-bold text-slate-900 text-sm tracking-tight border-b border-slate-100 pb-3">
          {t(lang, "Requested Items", "ඉල්ලූ භාණ්ඩ")}
        </h3>

        {/* COMMISSIONER: STORE SELECTION */}
        {isCommissioner && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t(lang, "Store / Division", "ගබඩාව / අංශය")}
            </label>
            <select
              value={selectedDivisionId}
              onChange={(e) =>
                setSelectedDivisionId(
                  e.target.value === "" ? "" : Number(e.target.value)
                )
              }
              className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
            >
              <option value="">{t(lang, "Select store...", "ගබඩාව තෝරන්න...")}</option>
              <option value="1">
                {t(lang, "Social Services Division Store", "සමාජ සේවා අංශ ගබඩාව")}
              </option>
              <option value="2">
                {t(lang, "Child Services Division Store", "ළමා සේවා අංශ ගබඩාව")}
              </option>
            </select>
          </div>
        )}

        {/* AO: DS OFFICE SELECTOR */}
        {isAo && reqType === "ds_office" && (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {t(lang, "Divisional Secretary Office", "ප්‍රාදේශීය ලේකම් කාර්යාලය")}
            </label>

            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={dsSearch}
                onFocus={() => setShowDsOptions(true)}
                onChange={(e) => {
                  setDsSearch(e.target.value);
                  setShowDsOptions(true);
                }}
                placeholder={t(
                  lang,
                  "Search DS Office...",
                  "DS කාර්යාලය සොයන්න..."
                )}
                className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all"
              />

              {showDsOptions && (
                <div className="absolute z-50 mt-1 w-full max-h-56 overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-md shadow-xl divide-y divide-slate-100 custom-scrollbar">
                  {filteredDsOffices.map((office) => (
                    <button
                      key={office.id}
                      type="button"
                      onClick={() => {
                        setSelectedOrgId(office.id);
                        setDsSearch(
                          lang === "en" ? office.name_en : office.name_si
                        );
                        setShowDsOptions(false);
                      }}
                      className="w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-bold text-slate-800">
                        {lang === "en" ? office.name_en : office.name_si}
                      </div>
                      <div className="text-[10px] font-medium text-slate-400 mt-0.5">
                        {office.district}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedOrgId !== "" && (
                <div className="mt-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {t(lang, "District", "දිස්ත්‍රික්කය")}
                    </p>
                    <p className="text-xs font-bold text-slate-800 mt-0.5">
                      {
                        dsOffices.find((office) => office.id === selectedOrgId)
                          ?.district
                      }
                    </p>
                  </div>
                  <Building2 className="w-4 h-4 text-slate-400" />
                </div>
              )}
            </div>

            {!loadingDsOffices && dsOffices.length === 0 && (
              <p className="mt-1.5 text-[11px] font-medium text-slate-400">
                {t(
                  lang,
                  "No DS Offices found for your division.",
                  "ඔබගේ අංශය සඳහා කාර්යාල හමු නොවීය."
                )}
              </p>
            )}
          </div>
        )}

        {/* ITEM SEARCH FILTER */}
        <div className="relative">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t(
              lang,
              "Search items by name or code…",
              "නාමය හෝ කේතය මගින් සෙවීම…"
            )}
            className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
        </div>

        {/* DYNAMIC ITEM ROWS */}
        <div className="space-y-3 pt-1">
          {rows.map((row, i) => (
            <div
              key={row.rowId}
              className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 sm:items-end bg-slate-50/50 p-3 sm:p-0 rounded-xl sm:bg-transparent border sm:border-0 border-slate-200/60"
            >
              {/* Item Select Field */}
              <div className="flex-1 min-w-0">
                {i === 0 && (
                  <label className="hidden sm:block text-xs font-bold text-slate-700 mb-1.5">
                    {t(lang, "Item", "භාණ්ඩය")}
                  </label>
                )}

                <select
                  disabled={
                    (isCommissioner && !selectedDivisionId) ||
                    (isAo && reqType === "ds_office" && !selectedOrgId) ||
                    loadingItems
                  }
                  value={row.item_id === "" ? "" : String(row.item_id)}
                  onChange={(e) =>
                    setRow(
                      row.rowId,
                      "item_id",
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {isCommissioner && !selectedDivisionId
                      ? t(lang, "Select store first…", "පළමුව ගබඩාව තෝරන්න…")
                      : isAo && reqType === "ds_office" && !selectedOrgId
                      ? t(lang, "Select DS Office first…", "පළමුව කාර්යාලය තෝරන්න…")
                      : loadingItems
                      ? t(lang, "Loading items…", "පූරණය වෙමින්…")
                      : t(lang, "Select item…", "භාණ්ඩය තෝරන්න…")}
                  </option>
                  {(search ? filteredItems : items).map((it) => (
                    <option key={it.id} value={it.id}>
                      {it.name_en} ({it.item_code})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity Input & Remove Action Row */}
              <div className="flex items-center gap-2">
                <div className="flex-1 sm:w-24">
                  {i === 0 && (
                    <label className="hidden sm:block text-xs font-bold text-slate-700 mb-1.5 text-center">
                      {t(lang, "Qty", "ප්‍රමාණය")}
                    </label>
                  )}
                  <input
                    type="number"
                    min={1}
                    value={row.qty}
                    onChange={(e) =>
                      setRow(
                        row.rowId,
                        "qty",
                        parseInt(e.target.value) || 1
                      )
                    }
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 text-center outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeRow(row.rowId)}
                  disabled={rows.length === 1}
                  className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-all disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-slate-400 shrink-0 cursor-pointer"
                  title={t(lang, "Remove row", "පේළිය ඉවත් කරන්න")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* ADD ITEM ROW BUTTON */}
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors pt-1 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t(lang, "Add another item", "තවත් භාණ්ඩයක් එකතු කරන්න")}</span>
        </button>

        {/* NOTES TEXTAREA */}
        <div className="pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            {t(lang, "Notes (optional)", "සටහන් (අවශ්‍ය නම්)")}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t(
              lang,
              "Any additional information…",
              "අමතර තොරතුරු…"
            )}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs font-medium text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 resize-none"
          />
        </div>

        {/* FORM ACTION BUTTONS */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="w-full sm:w-auto h-10 px-5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
          >
            {t(lang, "Cancel", "අවලංගු")}
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full sm:w-auto h-10 px-6 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{t(lang, "Submitting…", "ඉදිරිපත් කරමින්…")}</span>
              </>
            ) : (
              <span>{t(lang, "Submit Request", "ඉල්ලීම ඉදිරිපත් කරන්න")}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}