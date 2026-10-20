import { useCallback, useEffect, useState } from "react";
import { Activity, ArrowDownToLine, ArrowUpFromLine, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { t } from "../../constants/translations";
import { isIncomingMovement, type StockMovement } from "../../types/stockMovements";
import type { Lang } from "../../types";
import { getStockMovements } from "../../../services/stockMovementService";

const PAGE_SIZE = 10;

export function RecentActivityTable({ lang }: { lang: Lang }) {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadPage = useCallback(async (page: number) => {
    try {
      setLoading(true);
      setError(false);
      const response = await getStockMovements({ page, per_page: PAGE_SIZE });
      setMovements((previous) => page === 1 ? response.data : [...previous, ...response.data]);
      if (page === 1) setVisibleCount(response.data.length);
      else setVisibleCount((previous) => previous + response.data.length);
      setCurrentPage(response.current_page);
      setLastPage(response.last_page);
      setTotal(response.total);
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPage(1);
  }, [loadPage]);

  const visibleMovements = movements.slice(0, visibleCount);
  const canShowMore = visibleCount < movements.length || currentPage < lastPage;

  function handleShowMore() {
    if (visibleCount < movements.length) {
      setVisibleCount((count) => Math.min(count + PAGE_SIZE, movements.length));
      return;
    }

    void loadPage(currentPage + 1);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
      <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-900 text-sm tracking-tight">
          {t(lang, "Recent Movements", "මෑත චලනය")}
        </h3>
        {total > 0 && (
          <span className="text-xs font-semibold text-slate-400">
            {t(lang, "Showing", "පෙන්වන්නේ")} {visibleMovements.length} {t(lang, "of", "න්")} {total} {t(lang, "records", "වාර්තා")}
          </span>
        )}
      </div>

      {loading && movements.length === 0 ? (
        <div className="px-5 py-8 flex items-center justify-center gap-2 text-xs font-medium text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          {t(lang, "Loading movements…", "චලන පූරණය වෙමින්…")}
        </div>
      ) : error && movements.length === 0 ? (
        <div className="px-5 py-8 text-center text-xs font-medium text-rose-600">
          {t(lang, "Unable to load movements.", "චලන පූරණය කළ නොහැක.")}
        </div>
      ) : visibleMovements.length === 0 ? (
        <div className="px-5 py-8 text-center flex flex-col items-center justify-center gap-2">
          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">
            <Activity className="w-5 h-5" />
          </div>
          <p className="text-xs font-medium text-slate-500">
            {t(lang, "No recent movements.", "මෑත චලන නොමැත.")}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {visibleMovements.map((movement) => {
            const incoming = isIncomingMovement(movement.movement_type);

            return (
              <div key={movement.id} className="flex items-center gap-3.5 px-5 py-3.5 hover:bg-slate-50/80 transition-colors">
                <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${incoming ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                  {incoming ? <ArrowDownToLine className="w-4 h-4" /> : <ArrowUpFromLine className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate tracking-tight">
                    <span className="font-mono text-slate-500 font-semibold mr-1">{movement.item.item_code}</span>
                    — {movement.item.name_en}
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 mt-0.5 truncate">
                    {movement.performer.name} · {new Date(movement.created_at).toLocaleDateString()}
                  </div>
                </div>

                <span className={`text-xs font-extrabold font-mono px-2.5 py-1 rounded-lg border shrink-0 ${incoming ? "bg-emerald-50/60 text-emerald-700 border-emerald-200/60" : "bg-rose-50/60 text-rose-700 border-rose-200/60"}`}>
                  {incoming ? "+" : "-"}{Math.abs(Number(movement.quantity))}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {error && movements.length > 0 && (
        <p className="px-5 py-2 text-center text-xs text-rose-600">
          {t(lang, "Could not load more movements. Please try again.", "තවත් චලන පූරණය කළ නොහැක. නැවත උත්සාහ කරන්න.")}
        </p>
      )}

      {visibleCount > PAGE_SIZE && (
        <div className="px-5 pt-3 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount(PAGE_SIZE)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ChevronUp className="w-4 h-4" />
            {t(lang, "See fewer", "අඩුවෙන් බලන්න")}
          </button>
        </div>
      )}

      {movements.length > 0 && canShowMore && (
        <div className="px-5 py-3 border-t border-slate-100 flex justify-center">
          <button
            type="button"
            onClick={handleShowMore}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronDown className="w-4 h-4" />}
            {loading ? t(lang, "Loading…", "පූරණය වෙමින්…") : t(lang, "See more", "තවත් බලන්න")}
          </button>
        </div>
      )}
    </div>
  );
}
