import { useEffect, useState } from "react";
import { X, Printer } from "lucide-react";
import { fetchItemQrCodeBlob, fetchItemBarcodeBlob } from "../../../services/ItemService";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";
import type { InventoryItem } from "../../types/inventory";

interface LabelImages {
  itemId: number;
  qrUrl: string;
  barcodeUrl: string;
}

export function PrintableItemLabels({
  lang,
  items,
  onClose,
}: {
  lang: Lang;
  items: InventoryItem[];
  onClose: () => void;
}) {
  const [images, setImages] = useState<LabelImages[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadImages() {
      try {
        const results = await Promise.all(
          items.map(async (item) => ({
            itemId: item.id,
            qrUrl: await fetchItemQrCodeBlob(item.id),
            barcodeUrl: await fetchItemBarcodeBlob(item.id),
          })),
        );
        if (!cancelled) setImages(results);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadImages();
    return () => {
      cancelled = true;
      images.forEach((img) => {
        URL.revokeObjectURL(img.qrUrl);
        URL.revokeObjectURL(img.barcodeUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 print:bg-white print:static">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-lg print:shadow-none print:max-h-none print:max-w-none">
        <div className="flex items-center justify-between border-b border-gray-100 p-5 print:hidden">
          <h3 className="text-base font-semibold text-gray-900">
            {t(lang, "Print Item Labels", "භාණ්ඩ ලේබල් මුද්‍රණය")}
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              disabled={loading}
              className="flex items-center gap-2 rounded-xl bg-[#4295D9] px-4 py-2 text-sm font-semibold text-white hover:bg-[#3280C4] disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              {t(lang, "Print", "මුද්‍රණය")}
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <p className="p-8 text-center text-sm text-gray-400">{t(lang, "Preparing labels…", "ලේබල් සකසමින්…")}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-5 print:grid-cols-3 print:gap-2">
            {items.map((item) => {
              const img = images.find((i) => i.itemId === item.id);
              return (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-3 flex flex-col items-center text-center break-inside-avoid"
                >
                  <p className="text-xs font-semibold text-gray-900 truncate w-full">{item.name_en}</p>
                  <p className="font-mono text-[10px] text-gray-500 mb-2">{item.item_code}</p>
                  {img && (
                    <>
                      <img src={img.qrUrl} alt="QR code" className="w-20 h-20 mb-1" />
                      <img src={img.barcodeUrl} alt="Barcode" className="w-full h-8 object-contain" />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}