import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { confirmEquipmentReturn, getPendingEquipmentReturns, type EquipmentAssignment } from "../../../services/equipmentAssignmentService";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";

const conditions: NonNullable<EquipmentAssignment["return_condition"]>[] = ["GOOD", "DAMAGED", "MALFUNCTIONED", "BEYOND_REPAIR"];

export function EquipmentReturnsPanel({ lang }: { lang: Lang }) {
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [condition, setCondition] = useState<EquipmentAssignment["return_condition"]>("GOOD");
  const [remarks, setRemarks] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    try { setLoading(true); setAssignments(await getPendingEquipmentReturns()); }
    catch (err) { console.error(err); setError(t(lang, "Unable to load equipment returns.", "උපකරණ ආපසු ලැයිස්තුව පූරණය කළ නොහැක.")); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function confirm(id: number) {
    try {
      await confirmEquipmentReturn(id, { condition, remarks: remarks.trim() || undefined });
      setAssignments((current) => current.filter((assignment) => assignment.id !== id));
      setSelectedId(null); setRemarks(""); setCondition("GOOD");
    } catch (err) { console.error(err); setError(t(lang, "Unable to confirm this return.", "ආපසු ලබාගැනීම තහවුරු කළ නොහැක.")); }
  }

  if (loading) return <div className="py-10 text-center"><Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" /></div>;
  return <div className="space-y-4">{error && <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700"><AlertCircle className="h-4 w-4" />{error}</div>}<div className="rounded-2xl border border-slate-200 bg-white p-4"><h2 className="text-sm font-bold text-slate-900">{t(lang, "Equipment Awaiting Return", "ආපසු ලබාදීමට ඇති උපකරණ")}</h2><p className="mt-1 text-xs text-slate-500">{assignments.length} {t(lang, "equipment item(s)", "උපකරණ")}</p></div><div className="grid gap-3 lg:grid-cols-2">{assignments.map((assignment) => <article key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-bold text-slate-500">{assignment.item.item_code}</p><h3 className="font-bold text-slate-900">{assignment.item.name_en}</h3><p className="mt-1 text-xs text-slate-600">{t(lang, "Assigned to", "පවරා ඇත්තේ")}: {assignment.assigned_to_user?.name ?? `#${assignment.assigned_to}`}</p></div><span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">{assignment.status}</span></div><p className="mt-3 rounded-lg bg-slate-50 p-2 text-xs text-slate-600">{assignment.return_reason ?? t(lang, "Return required", "ආපසු ලබාදීම අවශ්‍යයි")}</p>{selectedId === assignment.id ? <div className="mt-3 space-y-2"><select value={condition ?? "GOOD"} onChange={(event) => setCondition(event.target.value as EquipmentAssignment["return_condition"])} className="h-9 w-full rounded-lg border border-slate-200 px-2 text-xs">{conditions.map((value) => <option key={value} value={value}>{value}</option>)}</select><input value={remarks} onChange={(event) => setRemarks(event.target.value)} placeholder={t(lang, "Return remarks", "ආපසු ලබාගැනීමේ සටහන්")} className="h-9 w-full rounded-lg border border-slate-200 px-3 text-xs" /><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelectedId(null)} className="rounded-lg border px-3 py-2 text-xs font-bold">{t(lang, "Cancel", "අවලංගු")}</button><button type="button" onClick={() => void confirm(assignment.id)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white">{t(lang, "Confirm Return", "ආපසු ලැබුණු බව තහවුරු කරන්න")}</button></div></div> : <button type="button" onClick={() => setSelectedId(assignment.id)} className="mt-3 flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white"><CheckCircle2 className="h-3.5 w-3.5" />{t(lang, "Confirm Physical Return", "භෞතික ආපසු ලබාගැනීම තහවුරු කරන්න")}</button>}</article>)}</div>{assignments.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">{t(lang, "No equipment is awaiting return.", "ආපසු ලබාදීමට උපකරණ නොමැත.")}</p>}</div>;
}
