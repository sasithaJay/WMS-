import { useEffect, useState } from "react";
import { PlusCircle, X, AlertCircle, CheckCircle2 } from "lucide-react";
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
  const [reqType, setReqType] = useState<"personal" | "section" | "ds_office">("personal");
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
  const search = dsSearch.toLowerCase().trim();

  return (
    office.name_en.toLowerCase().includes(search) ||
    office.name_si.includes(dsSearch) ||
    office.district.toLowerCase().includes(search)
  );
});

useEffect(() => {
  const handler = () => setShowDsOptions(false);

  window.addEventListener("click", handler);

  return () =>
    window.removeEventListener("click", handler);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reqType]);

  async function loadItems() {
    try {
      setLoadingItems(true);
      const response = await getItems({ 
        per_page: 500,
        ...(isCommissioner && selectedDivisionId ? { division_id: selectedDivisionId as number } : {}),
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
      it.item_code.toLowerCase().includes(search.toLowerCase()),
  );

  const addRow = () =>
    setRows((r) => [...r, { rowId: createRowId(), item_id: "", qty: 1 }]);

  const removeRow = (rowId: string) =>
    setRows((r) => (r.length === 1 ? r : r.filter((row) => row.rowId !== rowId)));

  const setRow = (rowId: string, field: keyof Omit<RequestRow, "rowId">, val: string | number) =>
    setRows((r) =>
      r.map((row) => (row.rowId === rowId ? { ...row, [field]: val } : row)),
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
      return t(lang, "Please select a Divisional Secretary Office.", "කරුණාකර ප්‍රාදේශීය ලේකම් කාර්යාලය තෝරන්න.");
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
          `ඉල්ලීම ${request.request_number} ඉදිරිපත් කරන ලදී.`,
        ),
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
          t(lang, "You are not permitted to submit this request.", "මෙම ඉල්ලීම ඉදිරිපත් කිරීමට ඔබට අවසර නැත."),
        );
      } else {
        console.error(err);
        setError(
          t(lang, "Unable to submit the request. Please try again.", "ඉල්ලීම ඉදිරිපත් කළ නොහැක. නැවත උත්සාහ කරන්න."),
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      {isFA && (
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
          {(["personal", "section"] as const).map((tb) => (
            <button
              key={tb}
              onClick={() => setReqType(tb)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                reqType === tb ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
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
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
          {(["personal", "ds_office"] as const).map((tb) => (
            <button
              key={tb}
              onClick={() => setReqType(tb)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                reqType === tb ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              {tb === "personal"
                ? t(lang, "Personal Request", "පෞද්ගලික ඉල්ලීම")
                : t(lang, "DS Office Request", "ප්‍රාදේශීය ලේකම් කාර්යාල ඉල්ලීම")}
            </button>
          ))}
        </div>
      )}

      {reqType === "ds_office" ? (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-700 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {t(
            lang,
            "Each Divisional Secretary Office may submit one request per year.",
            "එක් එක් ප්‍රාදේශීය ලේකම් කාර්යාලයට වසරකට එක් ඉල්ලීමක් ඉදිරිපත් කළ හැක.",
          )}
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-700 flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {t(lang, "You may submit one personal request per month.", "ඔබට මසකට පෞද්ගලික ඉල්ලීමක් ඉදිරිපත් කළ හැකිය.")}
        </div>
      )}

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

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        <h3 className="font-semibold text-gray-900">{t(lang, "Requested Items", "ඉල්ලූ භාණ්ඩ")}</h3>

        {isCommissioner && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t(lang, "Store / Division", "ගබඩාව / අංශය")}
            </label>

            <select
              value={selectedDivisionId}
              onChange={(e) =>
                setSelectedDivisionId(e.target.value === "" ? "" : Number(e.target.value))
              }
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">{t(lang, "Select store...", "ගබඩාව තෝරන්න...")}</option>
              <option value="1">{t(lang, "Social Services Division Store", "සමාජ සේවා අංශ ගබඩාව")}</option>
              <option value="2">{t(lang, "Child Services Division Store", "ළමා සේවා අංශ ගබඩාව")}</option>
            </select>
          </div>
        )}

        {isAo && reqType === "ds_office" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                  "DS කාර්යාලය සොයන්න...",
                )}
                className="w-full rounded-xl border border-gray-200 px-4 py-3"
              />

              {showDsOptions && (
                <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                  {filteredDsOffices.map((office) => (
                    <button
                      key={office.id}
                      type="button"
                      onClick={() => {
                        setSelectedOrgId(office.id);

                        setDsSearch(
                          lang === "en"
                            ? office.name_en
                            : office.name_si,
                        );

                        setShowDsOptions(false);
                      }}
                      className="w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-[#EBF4FD]"
                    >
                      <div className="font-medium">
                        {lang === "en"
                          ? office.name_en
                          : office.name_si}
                      </div>

                      <div className="text-xs text-gray-500">
                        {office.district}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {selectedOrgId !== "" && (
                <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs text-gray-500">
                    {t(lang, "District", "දිස්ත්‍රික්කය")}
                  </p>

                  <p className="text-sm font-medium text-gray-800">
                    {
                      dsOffices.find(
                        (office) => office.id === selectedOrgId,
                      )?.district
                    }
                  </p>
                </div>
              )}
            </div>

            {!loadingDsOffices && dsOffices.length === 0 && (
              <p className="mt-1.5 text-xs text-gray-400">
                {t(lang, "No DS Offices found for your division.", "ඔබගේ අංශය සඳහා කාර්යාල හමු නොවීය.")}
              </p>
            )}
          </div>
        )}

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t(lang, "Search items by name or code…", "නාමය හෝ කේතය මගින් සෙවීම…")}
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white"
        />

        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={row.rowId} className="flex gap-3 items-end">
              <div className="flex-1">
                {i === 0 && (
                  <label className="block text-xs font-medium text-gray-500 mb-1">
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
                    setRow(row.rowId, "item_id", e.target.value === "" ? "" : Number(e.target.value))
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
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

              <div className="w-24">
                {i === 0 && (
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {t(lang, "Qty", "ප්‍රමාණය")}
                  </label>
                )}
                <input
                  type="number"
                  min={1}
                  value={row.qty}
                  onChange={(e) => setRow(row.rowId, "qty", parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white text-center"
                />
              </div>

              <button
                onClick={() => removeRow(row.rowId)}
                disabled={rows.length === 1}
                className="mb-0.5 w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-all disabled:opacity-30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addRow}
          className="flex items-center gap-2 text-[#4295D9] text-sm font-medium hover:text-[#3280C4] transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          {t(lang, "Add another item", "තවත් භාණ්ඩයක් එකතු කරන්න")}
        </button>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t(lang, "Notes (optional)", "සටහන් (අවශ්‍ය නම්)")}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t(lang, "Any additional information…", "අමතර තොරතුරු…")}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white resize-none"
          />
        </div>

        <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
          <button
            onClick={onCancel}
            disabled={submitting}
            className="w-full sm:w-auto px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-60"
          >
            {t(lang, "Cancel", "අවලංගු")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all disabled:opacity-60"
          >
            {submitting
              ? t(lang, "Submitting…", "ඉදිරිපත් කරමින්…")
              : t(lang, "Submit Request", "ඉල්ලීම ඉදිරිපත් කරන්න")}
          </button>
        </div>
      </div>
    </div>
  );
}