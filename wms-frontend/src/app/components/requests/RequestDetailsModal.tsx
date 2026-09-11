import { X, ClipboardList, Calendar, Package, Tag } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";

interface RequestDetail {
  ref?: string;
  date?: string;
  items?: string[];
  status?: string;
}

export function RequestDetailsModal({
  open,
  onClose,
  request,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  request: RequestDetail | null;
  lang: Lang;
}) {
  if (!open || !request) return null;

  return (
    <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[100] grid place-items-center p-4">
      {/* Backdrop with Frosted Blur Effect */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-md transition-opacity"
      />

      {/* Centered Modal Content Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 z-10 overflow-hidden flex flex-col max-h-[85vh] my-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                {t(lang, "Request Details", "ඉල්ලීම් විස්තර")}
              </h3>
              {request.ref && (
                <p className="text-[10px] font-mono font-bold text-slate-400">
                  {request.ref}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {request.ref && (
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                {t(lang, "Reference Number", "යොමු අංකය")}
              </span>
              <p className="font-mono text-xs font-extrabold text-slate-900">
                {request.ref}
              </p>
            </div>
          )}

          {request.date && (
            <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[10px]">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {t(lang, "Date Submitted", "ඉදිරිපත් කළ දිනය")}
              </span>
              <p className="font-bold text-slate-800">{request.date}</p>
            </div>
          )}

          {request.status && (
            <div className="bg-slate-50/60 p-3 rounded-xl border border-slate-100 space-y-1">
              <span className="text-slate-400 font-medium flex items-center gap-1.5 text-[10px]">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {t(lang, "Status", "තත්ත්වය")}
              </span>
              <p className="font-bold text-slate-800">{request.status}</p>
            </div>
          )}

          {request.items && request.items.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-slate-400 font-bold flex items-center gap-1.5 text-[10px] uppercase tracking-wider">
                <Package className="w-3.5 h-3.5 text-slate-400" />
                {t(lang, "Requested Items", "ඉල්ලූ භාණ්ඩ")}
              </span>
              <div className="flex flex-wrap gap-1.5 bg-slate-50/60 p-3 rounded-2xl border border-slate-100">
                {request.items.map((item) => (
                  <span
                    key={item}
                    className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/80"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto h-9 px-5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs hover:shadow-md cursor-pointer"
          >
            {t(lang, "Close", "වසන්න")}
          </button>
        </div>
      </div>
    </div>
  );
}