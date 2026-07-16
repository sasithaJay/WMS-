import { useEffect, useState, useCallback } from "react";
import { ArrowDownToLine, ArrowUpFromLine, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
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

export function StockMovementTable({ lang, refreshSignal = 0 }: StockMovementTableProps) {
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
          "තොග චලන ඉතිහාසය පූරණය කළ නොහැක.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [lang, movements.length]);

  async function handleSeeMore() {
    const nextVisibleCount = visibleCount + PAGE_SIZE;

    // If we already have enough cached records fetched, just reveal more —
    // no API call needed.
    if (nextVisibleCount <= movements.length) {
      setVisibleCount(nextVisibleCount);
      return;
    }

    // Otherwise, reveal what we have and fetch the next page to fill the rest.
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
          "තවත් චලන පූරණය කළ නොහැක.",
        ),
      );
    } finally {
      setLoadingMore(false);
    }
  }

  function handleShowLess() {
    setVisibleCount(PAGE_SIZE);
  }

  // Initial load
  useEffect(() => {
    loadFirstPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On refresh signal (e.g. after confirming a receipt), reset back to page 1
  useEffect(() => {
    if (refreshSignal > 0) {
      loadFirstPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshSignal]);

  const visibleMovements = movements.slice(0, visibleCount);
  const canSeeMore = visibleCount < movements.length || currentPage < lastPage;
  const isExpanded = visibleCount > PAGE_SIZE;

  return (
    <div className="bg-white rounded-xl border border-gray-100">
      <div className="px-5 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-sm">
          {t(lang, "Stock Movement History", "තොග චලන ඉතිහාසය")}
        </h3>
      </div>

      {loading && (
        <p className="px-5 py-6 text-sm text-gray-400">
          {t(lang, "Loading…", "පූරණය වෙමින්…")}
        </p>
      )}

      {!loading && error && movements.length === 0 && (
        <p className="px-5 py-6 text-sm text-red-500">{error}</p>
      )}

      {!loading && movements.length === 0 && !error && (
        <p className="px-5 py-6 text-sm text-gray-400">
          {t(lang, "No stock movements yet.", "තොග චලන නොමැත.")}
        </p>
      )}

      {!loading && movements.length > 0 && (
        <>
          <div className="divide-y divide-gray-50">
            {visibleMovements.map((m) => {
              const incoming = isIncomingMovement(m.movement_type);
              const label = MOVEMENT_LABELS[m.movement_type];
              const quantity = Number(m.quantity);

              return (
                <div
                  key={m.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/50 transition-colors"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      incoming ? "bg-green-50" : "bg-red-50"
                    }`}
                  >
                    {incoming ? (
                      <ArrowDownToLine className="w-4 h-4 text-green-600" />
                    ) : (
                      <ArrowUpFromLine className="w-4 h-4 text-red-500" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {m.item.item_code} - {m.item.name_en}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {label ? t(lang, label.en, label.si) : m.movement_type}
                      {m.reference_number ? ` · ${m.reference_number}` : ""}
                      {" · "}
                      {m.performer.name} · {formatDateTime(m.created_at)}
                    </div>
                  </div>

                  <span
                    className={`text-sm font-bold flex-shrink-0 ${
                      incoming ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {incoming ? "+" : "-"}
                    {Math.abs(quantity)}
                  </span>
                </div>
              );
            })}
          </div>

          {error && movements.length > 0 && (
            <p className="px-5 py-2 text-xs text-red-500">{error}</p>
          )}

          {(canSeeMore || isExpanded) && (
            <div className="border-t border-gray-50 px-5 py-3">
              <button
                type="button"
                onClick={canSeeMore ? handleSeeMore : handleShowLess}
                disabled={loadingMore}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-semibold text-[#4295D9] hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    {t(lang, "Loading…", "පූරණය වෙමින්…")}
                  </>
                ) : canSeeMore ? (
                  <>
                    {t(lang, "See More", "තව බලන්න")}
                    <ChevronDown className="h-3.5 w-3.5" />
                  </>
                ) : (
                  <>
                    {t(lang, "Show Less", "අඩුවෙන් පෙන්වන්න")}
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