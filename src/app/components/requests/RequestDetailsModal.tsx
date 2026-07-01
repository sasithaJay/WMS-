import { X } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900">{t(lang, "Request Details", "ඉල්ලීම් විස්තර")}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          {request.ref && (
            <div>
              <div className="text-xs text-gray-400">{t(lang, "Reference", "යොමු")}</div>
              <div className="font-mono text-sm font-semibold text-gray-900">{request.ref}</div>
            </div>
          )}
          {request.date && (
            <div>
              <div className="text-xs text-gray-400">{t(lang, "Date", "දිනය")}</div>
              <div className="text-sm text-gray-900">{request.date}</div>
            </div>
          )}
          {request.items && request.items.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-1">{t(lang, "Items", "භාණ්ඩ")}</div>
              <div className="flex flex-wrap gap-1">
                {request.items.map((item) => (
                  <span key={item} className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#EBF4FD] text-[#4295D9] border border-blue-100">{item}</span>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-50 transition-all">
            {t(lang, "Close", "වසන්න")}
          </button>
        </div>
      </div>
    </div>
  );
}
