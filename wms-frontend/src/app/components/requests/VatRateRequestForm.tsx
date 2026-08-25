import { useState } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
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
      setError(t(lang, "Enter a valid VAT percentage between 0 and 100.", "0 සහ 100 අතර වලංගු VAT ප්‍රතිශතයක් ඇතුළත් කරන්න."));
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setSuccessMessage("");

      await submitVatRateChange(value);

      setSuccessMessage(
        t(lang, "VAT rate change submitted for Commissioner approval.", "VAT අනුපාතය කොමසාරිස්වරයාගේ අනුමැතිය සඳහා ඉදිරිපත් කරන ලදී."),
      );
      setPercentage("");
      onSubmitted?.();
    } catch (err) {
      const axiosErr = err as AxiosError<LaravelValidationErrorBody>;

      if (axiosErr.response?.status === 422) {
        setError(
          axiosErr.response.data.message ??
            t(lang, "Unable to submit VAT rate change.", "VAT අනුපාත වෙනස ඉදිරිපත් කළ නොහැක."),
        );
      } else {
        console.error(err);
        setError(t(lang, "Unable to submit VAT rate change. Please try again.", "VAT අනුපාත වෙනස ඉදිරිපත් කළ නොහැක. නැවත උත්සාහ කරන්න."));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-gray-900">
          {t(lang, "Change VAT Rate", "VAT අනුපාතය වෙනස් කරන්න")}
        </h3>
        <p className="mt-1 text-xs text-gray-500">
          {t(lang, "Current rate", "වත්මන් අනුපාතය")}: <span className="font-semibold text-gray-700">{currentPercentage}%</span>
        </p>
      </div>

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

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
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
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 pr-8 text-sm outline-none transition focus:border-[#4295D9] focus:bg-white focus:ring-2 focus:ring-[#4295D9]/20"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">%</span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-xl bg-[#4295D9] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#3280C4] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting
            ? t(lang, "Submitting…", "ඉදිරිපත් කරමින්…")
            : t(lang, "Submit for Approval", "අනුමැතිය සඳහා ඉදිරිපත් කරන්න")}
        </button>
      </div>
    </div>
  );
}