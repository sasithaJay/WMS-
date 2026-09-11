import { useState } from "react";
import { AlertCircle, CheckCircle2, Percent, Loader2, Send } from "lucide-react";
import { AxiosError } from "axios";
import { submitVatRateChange } from "../../../services/vatRateService";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";

interface LaravelValidationErrorBody {
  message?: string;
  errors?: Record<string, string[]>;
}

export function VatRateRequestForm({
  lang,
  currentPercentage,
  onSubmitted,
}: {
  lang: Lang;
  currentPercentage: number;
  onSubmitted?: () => void;
}) {
  const [percentage, setPercentage] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const value = Number(percentage);

    if (percentage.trim() === "" || Number.isNaN(value) || value < 0 || value > 100) {
      setError(
        t(
          lang,
          "Enter a valid VAT percentage between 0 and 100.",
          "0 සහ 100 අතර වලංගු VAT ප්‍රතිශතයක් ඇතුළත් කරන්න."
        )
      );
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      await submitVatRateChange(value);

      setSuccessMessage(
        t(
          lang,
          "VAT rate change submitted for Commissioner approval.",
          "VAT අනුපාතය කොමසාරිස්වරයාගේ අනුමැතිය සඳහා ඉදිරිපත් කරන ලදී."
        )
      );
      setPercentage("");
      onSubmitted?.();
    } catch (err) {
      const axiosErr = err as AxiosError<LaravelValidationErrorBody>;

      if (axiosErr.response?.status === 422) {
        setError(
          axiosErr.response.data.message ??
            t(
              lang,
              "Unable to submit VAT rate change.",
              "VAT අනුපාත වෙනස ඉදිරිපත් කළ නොහැක."
            )
        );
      } else {
        console.error(err);
        setError(
          t(
            lang,
            "Unable to submit VAT rate change. Please try again.",
            "VAT අනුපාත වෙනස ඉදිරිපත් කළ නොහැක. නැවත උත්සාහ කරන්න."
          )
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 tracking-tight">
            {t(lang, "Change VAT Rate", "VAT අනුපාතය වෙනස් කරන්න")}
          </h3>
          <p className="mt-1 text-xs font-medium text-slate-500">
            {t(lang, "Current active system rate", "වත්මන් පද්ධති අනුපාතය")}:{" "}
            <span className="font-mono font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
              {currentPercentage}%
            </span>
          </p>
        </div>

        <div className="w-9 h-9 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
          <Percent className="w-4 h-4" />
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200/80 rounded-2xl p-4 text-xs font-semibold text-rose-700 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-xs font-semibold text-emerald-700 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Input & Action Section */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 pt-1">
        <div className="flex-1 space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            {t(lang, "New VAT Percentage", "නව VAT ප්‍රතිශතය")}
          </label>
          <div className="relative">
            <input
              type="number"
              min={0}
              max={100}
              step="0.01"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              placeholder="18.00"
              className="w-full h-10 px-3.5 pr-8 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-mono font-bold text-slate-900 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-400 placeholder:font-sans"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-mono">
              %
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="h-10 px-5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0"
        >
          {submitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{t(lang, "Submitting…", "ඉදිරිපත් කරමින්…")}</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>{t(lang, "Submit for Approval", "අනුමැතිය සඳහා ඉදිරිපත් කරන්න")}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}