import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";

interface CameraScannerModalProps {
  lang: Lang;
  onResult: (code: string) => void;
  onClose: () => void;
}

const SCANNER_ELEMENT_ID = "camera-scanner-region";

export function CameraScannerModal({ lang, onResult, onClose }: CameraScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          if (stoppedRef.current) return;
          stoppedRef.current = true;
          scanner.stop().catch(() => {});
          onResult(decodedText);
        },
        () => {
          // per-frame decode failure — expected constantly while aiming, ignore
        },
      )
      .catch((err) => {
        console.error("Unable to start camera scanner:", err);
      });

    return () => {
      if (!stoppedRef.current) {
        scanner.stop().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-4 shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900">
            {t(lang, "Scan Barcode / QR Code", "බාර්කේතය / QR කේතය ස්කෑන් කරන්න")}
          </h4>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div id={SCANNER_ELEMENT_ID} className="rounded-lg overflow-hidden" />
        <p className="text-xs text-gray-400 mt-2 text-center">
          {t(lang, "Point your camera at the code", "කේතය දෙසට ඔබගේ කැමරාව යොමු කරන්න")}
        </p>
      </div>
    </div>
  );
}