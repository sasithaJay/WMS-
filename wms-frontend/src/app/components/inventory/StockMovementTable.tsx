import { useEffect, useState, useCallback } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ChevronDown,
  ChevronUp,
  Loader2,
  History,
  Inbox,
  AlertCircle,
} from "lucide-react";
import { getStockMovements } from "../../../services/stockMovementService";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import {
  isIncomingMovement,
  type StockMovement,
} from "../../types/stockMovements";

const MOVEMENT_LABELS: Record<string, { en: string; si: string }> = {
  RECEIPT: { en: "Stock Receipt", si: "තොග ලැබීම" },
  ISSUE: { en: "Stock Issue", si: "තොග නිකුත් කිරීම" },
  RETURN: { en: "Return", si: "ආපසු භාර දීම" },
  ADJUSTMENT_IN: { en: "Adjustment (In)", si: "සකස් කිරීම (ඇතුළත්)" },
  ADJUSTMENT_OUT: { en: "Adjustment (Out)", si: "සකස් කිරීම (පිටත)" },
};

const PAGE_SIZE = 5;

interface StockMovementTableProps {
  lang: Lang;
  refreshSignal?: number;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StockMovementTable({
  lang,
  refreshSignal = 0,
}: StockMovementTableProps) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const loadFirstPage = useCallback(async () => {
    try {
      setLoading((prev) => (movements.length === 0 ? true : prev));
      setError("");

      const response = await getStockMovements({
        page: 1,
        per_page: PAGE_SIZE,
      });

      setMovements(response.data);
      setVisibleCount(PAGE_SIZE);
      setCurrentPage(response.current_page);
      setLastPage(response.last_page);
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to load stock movement history.",
          "තොග චලන ඉතිහාසය පූරණය කළ නොහැක."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [lang, movements.length]);

  async function handleSeeMore() {
    const nextVisibleCount = visibleCount + PAGE_SIZE;

    if (nextVisibleCount <= movements.length) {
      setVisibleCount(nextVisibleCount);
      return;
    }

    setVisibleCount(movements.length);

    if (currentPage >= lastPage) return;

    try {
      setLoadingMore(true);
      setError("");

      const nextPage = currentPage + 1;
      const response = await getStockMovements({
        page: nextPage,
        per_page: PAGE_SIZE,
      });

      setMovements((current) => {
        const updated = [...current, ...response.data];
        setVisibleCount(Math.min(nextVisibleCount, updated.length));
        return updated;
      });
      setCurrentPage(response.current_page);
      setLastPage(response.last_page);
    } catch (err) {
      console.error(err);
      setError(
        t(
          lang,
          "Unable to load more movements.",
          "තවත් චලන පූරණය කළ නොහැක."
        )
      );
    } finally {
      setLoadingMore(false);
    }
  }

  function handleShowLess() {
    setVisibleCount(PAGE_SIZE);
  }

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  useEffect(() => {
    if (refreshSignal > 0) {
      loadFirstPage();
    }
  }, [refreshSignal, loadFirstPage]);

  const visibleMovements = movements.slice(0, visibleCount);
  const canSeeMore = visibleCount < movements.length || currentPage < lastPage;
  const isExpanded = visibleCount > PAGE_SIZE;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Card Header */}
      <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
          <History className="w-4 h-4 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-900 text-sm tracking-tight">
            {t(lang, "Stock Movement History", "තොග චලන ඉතිහාසය")}
          </h3>
          <p className="text-[11px] font-medium text-slate-400">
            {t(
              lang,
              "Audit log of all stock receipts, issues, and adjustments",
              "සියලු තොග ලැබීම්, නිකුත් කිරීම් සහ සකස් කිරීම් පිළිබඳ වාර්තාව"
            )}
          </p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2.5">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <p className="text-xs font-semibold">
            {t(lang, "Loading…", "පූරණය වෙමින්…")}
          </p>
        </div>
      )}

      {/* Error Initial State */}
      {!loading && error && movements.length === 0 && (
        <div className="p-6 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-50 border border-rose-200/80 rounded-xl text-xs font-bold text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && movements.length === 0 && !error && (
        <div className="py-12 text-center flex flex-col items-center justify-center gap-2 text-slate-400">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center">
            <Inbox className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-xs font-medium text-slate-500">
            {t(lang, "No stock movements yet.", "තොග චලන නොමැත.")}
          </span>
        </div>
      )}

      {/* Content Entries List */}
      {!loading && movements.length > 0 && (
        <>
          <div className="divide-y divide-slate-100 text-xs">
            {visibleMovements.map((m) => {
              const incoming = isIncomingMovement(m.movement_type);
              const label = MOVEMENT_LABELS[m.movement_type];
              const quantity = Number(m.quantity);

              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-50/60 transition-colors"
                >
                  {/* Direction Icon Badge */}
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      incoming
                        ? "bg-emerald-50 border-emerald-100 text-emerald-600"
                        : "bg-rose-50 border-rose-100 text-rose-600"
                    }`}
                  >
                    {incoming ? (
                      <ArrowDownToLine className="w-4 h-4" />
                    ) : (
                      <ArrowUpFromLine className="w-4 h-4" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-extrabold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200/60 shrink-0">
                        {m.item.item_code}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 truncate">
                        {m.item.name_en}
                      </h4>
                    </div>

                    <p className="text-[11px] font-medium text-slate-400 truncate">
                      <span className="text-slate-600 font-semibold">
                        {label ? t(lang, label.en, label.si) : m.movement_type}
                      </span>
                      {m.reference_number ? ` · ${m.reference_number}` : ""}
                      {" · "}
                      {m.performer.name} · {formatDateTime(m.created_at)}
                    </p>
                  </div>

                  {/* Quantity Indicator */}
                  <div
                    className={`text-sm font-extrabold font-mono shrink-0 px-2 py-0.5 rounded-lg ${
                      incoming
                        ? "text-emerald-700 bg-emerald-50/50"
                        : "text-rose-700 bg-rose-50/50"
                    }`}
                  >
                    {incoming ? "+" : "-"}
                    {Math.abs(quantity)}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Append Error Message if present during pagination */}
          {error && movements.length > 0 && (
            <p className="px-5 py-2 text-xs font-semibold text-rose-600 bg-rose-50/50 border-t border-rose-100">
              {error}
            </p>
          )}

          {/* Expand & Collapse Trigger Footer */}
          {(canSeeMore || isExpanded) && (
            <div className="border-t border-slate-100 px-4 py-3 bg-slate-50/50">
              <button
                type="button"
                onClick={canSeeMore ? handleSeeMore : handleShowLess}
                disabled={loadingMore}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{t(lang, "Loading…", "පූරණය වෙමින්…")}</span>
                  </>
                ) : canSeeMore ? (
                  <>
                    <span>{t(lang, "See More", "තව බලන්න")}</span>
                    <ChevronDown className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    <span>{t(lang, "Show Less", "අඩුවෙන් පෙන්වන්න")}</span>
                    <ChevronUp className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}