import { useEffect, useState } from "react";
import { AlertCircle, Loader2, RotateCcw } from "lucide-react";
import { getMyEquipmentAssignments, requestEquipmentReturn, type EquipmentAssignment } from "../../../services/equipmentAssignmentService";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";

export function MyEquipmentAssignmentsPanel({ lang }: { lang: Lang }) {
  const [assignments, setAssignments] = useState<EquipmentAssignment[]>([]);
  const [selected, setSelected] = useState<EquipmentAssignment | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => { getMyEquipmentAssignments().then(setAssignments).catch(() => setError(t(lang, "Unable to load assigned equipment.", "පවරා ඇති උපකරණ පූරණය කළ නොහැක."))).finally(() => setLoading(false)); }, [lang]);
  async function submit() {
    if (!selected || !reason.trim()) return;
    try { await requestEquipmentReturn(selected.id, reason.trim()); setAssignments((current) => current.map((item) => item.id === selected.id ? { ...item, status: "RETURN_PENDING", return_reason: reason.trim() } : item)); setSelected(null); setReason(""); }
    catch (err) { console.error(err); setError(t(lang, "Unable to request the return.", "ආපසු ලබාදීම ඉල්ලා සිටිය නොහැක.")); }
  }
  if (loading) return <div className="py-6 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-blue-600" /></div>;
  return <div className="mt-6 space-y-3">{error && <div className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"><AlertCircle className="h-4 w-4" />{error}</div>}<h2 className="text-sm font-bold text-slate-900">{t(lang, "My Assigned Equipment", "මට පවරා ඇති උපකරණ")}</h2>{assignments.map((assignment) => <div key={assignment.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-xs text-slate-500">{assignment.item.item_code}</p><p className="font-bold text-slate-900">{assignment.item.name_en}</p><span className="text-[10px] font-bold text-amber-700">{assignment.status}</span></div>{assignment.status === "ASSIGNED" && <button type="button" onClick={() => { setSelected(assignment); setReason(""); }} className="flex items-center justify-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700"><RotateCcw className="h-3.5 w-3.5" />{t(lang, "Request Return / Replacement", "ආපසු / ප්‍රතිස්ථාපනය ඉල්ලන්න")}</button>}</div>)}{assignments.length === 0 && <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">{t(lang, "No returnable equipment assigned.", "ආපසු ලබාදිය යුතු උපකරණ නොමැත.")}</p>}{selected && <div className="fixed inset-0 z-50 grid place-items-center p-4"><div className="fixed inset-0 bg-slate-950/60" onClick={() => setSelected(null)} /><div className="relative w-full max-w-md space-y-4 rounded-2xl bg-white p-6"><h3 className="font-bold">{t(lang, "Request Equipment Return", "උපකරණ ආපසු ලබාදීම ඉල්ලන්න")}</h3><p className="text-xs text-slate-600">{selected.item.name_en}</p><textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} placeholder={t(lang, "Reason: malfunctioned or damaged", "හේතුව: දෝෂ සහිත හෝ හානි වී ඇත")} className="w-full rounded-xl border border-slate-200 p-3 text-xs" /><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelected(null)} className="rounded-lg border px-3 py-2 text-xs font-bold">{t(lang, "Cancel", "අවලංගු")}</button><button type="button" disabled={!reason.trim()} onClick={() => void submit()} className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">{t(lang, "Submit Return Request", "ආපසු ලබාදීමේ ඉල්ලීම යවන්න")}</button></div></div></div>}</div>;
}
