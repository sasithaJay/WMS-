import { useState, useRef } from "react";
import { ScanLine, Camera } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import { CameraScannerModal } from "./CameraScannerModal";

interface BarcodeScannerInputProps {
  lang: Lang;
  onScan: (code: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function BarcodeScannerInput({ lang, onScan, placeholder, autoFocus }: BarcodeScannerInputProps) {
  const [value, setValue] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && value.trim()) {
      onScan(value.trim());
      setValue("");
    }
  }

  function handleCameraResult(code: string) {
    setShowCamera(false);
    onScan(code);
    inputRef.current?.focus();
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder ?? t(lang, "Scan or type code…", "කේතය ස්කෑන් කරන්න හෝ ටයිප් කරන්න…")}
          className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#4295D9] focus:ring-2 focus:ring-[#4295D9]/20 bg-gray-50 focus:bg-white"
        />
      </div>
      <button
        type="button"
        onClick={() => setShowCamera(true)}
        title={t(lang, "Scan with camera", "කැමරාව සමඟ ස්කෑන් කරන්න")}
        className="flex-shrink-0 w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
      >
        <Camera className="w-4 h-4" />
      </button>

      {showCamera && (
        <CameraScannerModal
          lang={lang}
          onResult={handleCameraResult}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}