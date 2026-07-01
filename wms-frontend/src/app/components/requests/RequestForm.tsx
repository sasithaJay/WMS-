import { useState } from "react";
import { PlusCircle, X, AlertCircle } from "lucide-react";
import { INVENTORY_ITEMS } from "../../constants/mockData";
import { t } from "../../constants/translations";
import type { Lang, Role } from "../../types";

export function RequestForm({ lang, role, onCancel }: { lang: Lang; role: Role; onCancel: () => void }) {
  const [reqType, setReqType] = useState<"personal" | "section">("personal");
  const [rows, setRows] = useState([{ itemCode: "", qty: 1, unit: "" }]);
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const isFA = role === "SECTION_HEAD";

  const addRow = () => setRows((r) => [...r, { itemCode: "", qty: 1, unit: "" }]);
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));
  const setRow = (i: number, key: string, val: string | number) =>
    setRows((r) => r.map((row, idx) => idx === i ? { ...row, [key]: val } : row));


  const filteredItems = INVENTORY_ITEMS.filter((it) =>
    it.name.toLowerCase().includes(search.toLowerCase()) || it.code.includes(search)
  );


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
              {tb === "personal" ? t(lang, "Personal Request", "පෞද්ගලික ඉල්ලීම") : t(lang, "Section Request (Common Use)", "අංශ ඉල්ලීම")}
            </button>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-xs text-blue-700 flex items-center gap-2">
        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
        {t(lang, "You may submit one personal request per month.", "ඔබට මසකට පෞද්ගලික ඉල්ලීමක් ඉදිරිපත් කළ හැකිය.")}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        <h3 className="font-semibold text-gray-900">{t(lang, "Requested Items", "ඉල්ලූ භාණ්ඩ")}</h3>
        {role === "COMMISSIONER" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t(lang, "Store / Division", "ගබඩාව / අංශය")}
            </label>

            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">
                {t(lang, "Select store...", "ගබඩාව තෝරන්න...")}
              </option>
              <option value="social_services">
                {t(lang, "Social Services Division Store", "සමාජ සේවා අංශ ගබඩාව")}
              </option>
              <option value="child_services">
                {t(lang, "Child Services Division Store", "ළමා සේවා අංශ ගබඩාව")}
              </option>
            </select>
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
            <div key={i} className="flex gap-3 items-end">
              <div className="flex-1">
                {i === 0 && <label className="block text-xs font-medium text-gray-500 mb-1">{t(lang, "Item", "භාණ්ඩය")}</label>}

                <select
                  disabled={role === "COMMISSIONER" && !selectedStore}
                  value={row.itemCode}
                  onChange={(e) => {
                    const it = INVENTORY_ITEMS.find((x) => x.code === e.target.value);
                    setRow(i, "itemCode", e.target.value);
                    setRow(i, "unit", it?.unit || "");
                  }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
   
                  <option value="">
                    {role === "COMMISSIONER" && !selectedStore
                      ? t(lang, "Select store first…", "පළමුව ගබඩාව තෝරන්න…")
                      : t(lang, "Select item…", "භාණ්ඩය තෝරන්න…")}
                  </option>
                  {(search ? filteredItems : INVENTORY_ITEMS).map((it) => (
                    <option key={it.code} value={it.code}>{it.name} ({it.code})</option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                {i === 0 && <label className="block text-xs font-medium text-gray-500 mb-1">{t(lang, "Qty", "ප්‍රමාණය")}</label>}
                <input
                  type="number" min={1} value={row.qty}
                  onChange={(e) => setRow(i, "qty", parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white text-center"
                />
              </div>
              <div className="w-24">
                {i === 0 && <label className="block text-xs font-medium text-gray-500 mb-1">{t(lang, "Unit", "ඒකකය")}</label>}
                <input readOnly value={row.unit || "—"} className="w-full px-3 py-2.5 border border-gray-100 rounded-xl text-sm bg-gray-50 text-gray-400 text-center" />
              </div>
              <button
                onClick={() => removeRow(i)}
                disabled={rows.length === 1}
                className="mb-0.5 w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-all disabled:opacity-30"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={addRow} className="flex items-center gap-2 text-[#4295D9] text-sm font-medium hover:text-[#3280C4] transition-colors">
          <PlusCircle className="w-4 h-4" />
          {t(lang, "Add another item", "තවත් භාණ්ඩයක් එකතු කරන්න")}
        </button>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{t(lang, "Notes (optional)", "සටහන් (අවශ්‍ය නම්)")}</label>
          <textarea
            value={notes} onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={t(lang, "Any additional information…", "අමතර තොරතුරු…")}
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white resize-none"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
            {t(lang, "Cancel", "අවලංගු")}
          </button>
          <button className="flex-1 py-2.5 bg-[#4295D9] text-white text-sm font-semibold rounded-xl hover:bg-[#3280C4] transition-all">
            {t(lang, "Submit Request", "ඉල්ලීම ඉදිරිපත් කරන්න")}
          </button>
        </div>
      </div>
    </div>
  );
}
