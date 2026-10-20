import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Crop, RotateCcw, X, ZoomIn } from "lucide-react";
import { t } from "../../constants/translations";
import type { Lang } from "../../types";

type Props = {
  file: File;
  lang: Lang;
  onCancel: () => void;
  onCrop: (file: File) => void;
};

const OUTPUT_SIZE = 512;

export function ProfilePictureCropper({ file, lang, onCancel, onCrop }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [stageSize, setStageSize] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [cropping, setCropping] = useState(false);
  const [error, setError] = useState("");
  const imageUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => () => URL.revokeObjectURL(imageUrl), [imageUrl]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new ResizeObserver(() => setStageSize(stage.clientWidth));
    observer.observe(stage);
    setStageSize(stage.clientWidth);
    return () => observer.disconnect();
  }, []);

  const baseScale = image && stageSize
    ? Math.max(stageSize / image.naturalWidth, stageSize / image.naturalHeight)
    : 1;
  const renderedWidth = image ? image.naturalWidth * baseScale * zoom : stageSize;
  const renderedHeight = image ? image.naturalHeight * baseScale * zoom : stageSize;
  const centeredLeft = (stageSize - renderedWidth) / 2;
  const centeredTop = (stageSize - renderedHeight) / 2;
  const left = Math.max(stageSize - renderedWidth, Math.min(0, centeredLeft + offset.x));
  const top = Math.max(stageSize - renderedHeight, Math.min(0, centeredTop + offset.y));

  function beginDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!image) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: left - centeredLeft,
      offsetY: top - centeredTop,
    };
  }

  function moveImage(event: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || !image || !stageSize) return;

    const width = image.naturalWidth * baseScale * zoom;
    const height = image.naturalHeight * baseScale * zoom;
    const centeredX = (stageSize - width) / 2;
    const centeredY = (stageSize - height) / 2;
    const nextX = drag.offsetX + event.clientX - drag.x;
    const nextY = drag.offsetY + event.clientY - drag.y;

    setOffset({
      x: Math.max(stageSize - width - centeredX, Math.min(-centeredX, nextX)),
      y: Math.max(stageSize - height - centeredY, Math.min(-centeredY, nextY)),
    });
  }

  function endDrag() {
    dragRef.current = null;
  }

  async function applyCrop() {
    if (!image || !stageSize) return;
    setCropping(true);
    setError("");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Your browser could not crop this image.");

      const sourceX = Math.max(0, -left / (baseScale * zoom));
      const sourceY = Math.max(0, -top / (baseScale * zoom));
      const sourceSize = stageSize / (baseScale * zoom);
      context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => result ? resolve(result) : reject(new Error("Could not prepare the cropped image.")), "image/jpeg", 0.92);
      });

      onCrop(new File([blob], "profile-picture.jpg", { type: "image/jpeg", lastModified: Date.now() }));
    } catch (cropError) {
      setError(cropError instanceof Error ? cropError.message : t(lang, "Could not crop this image.", "මෙම පින්තූරය කපා සකස් කළ නොහැක."));
    } finally {
      setCropping(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="crop-profile-title" className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Crop className="h-4 w-4" /></span>
            <div>
              <h2 id="crop-profile-title" className="text-sm font-bold text-slate-900">{t(lang, "Crop profile picture", "පැතිකඩ පින්තූරය කපා සකසන්න")}</h2>
              <p className="mt-0.5 text-[11px] text-slate-500">{t(lang, "Drag to reposition, then adjust the zoom.", "ස්ථානය වෙනස් කිරීමට ඇදගෙන ගොස් විශාලනය සකසන්න.")}</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} aria-label={t(lang, "Close crop dialog", "කවුළුව වසන්න")} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X className="h-4 w-4" /></button>
        </header>

        <div className="flex flex-col items-center gap-5 p-5">
          <div
            ref={stageRef}
            className="relative aspect-square w-[min(320px,75vw)] touch-none cursor-grab overflow-hidden rounded-xl bg-slate-900 active:cursor-grabbing"
            onPointerDown={beginDrag}
            onPointerMove={moveImage}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
          >
            <img
              src={imageUrl}
              alt={t(lang, "Image crop preview", "පින්තූර කැපුම් පෙරදසුන")}
              draggable={false}
              onLoad={(event) => setImage(event.currentTarget)}
              className="pointer-events-none absolute max-w-none select-none"
              style={{ width: renderedWidth, height: renderedHeight, left, top }}
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/30" />
          </div>

          <div className="w-full max-w-xs">
            <label htmlFor="profile-picture-zoom" className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5"><ZoomIn className="h-3.5 w-3.5" />{t(lang, "Zoom", "විශාලනය")}</span>
              <span>{Math.round(zoom * 100)}%</span>
            </label>
            <input id="profile-picture-zoom" type="range" min="1" max="3" step="0.01" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-full accent-blue-600" />
          </div>

          {error && <p className="w-full rounded-lg bg-rose-50 p-2.5 text-xs font-medium text-rose-700">{error}</p>}
          <div className="flex w-full justify-between">
            <button type="button" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">
              <RotateCcw className="h-3.5 w-3.5" />{t(lang, "Reset", "නැවත සකසන්න")}
            </button>
            <div className="flex gap-2">
              <button type="button" onClick={onCancel} className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100">{t(lang, "Cancel", "අවලංගු කරන්න")}</button>
              <button type="button" onClick={applyCrop} disabled={!image || cropping} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50">
                <Check className="h-3.5 w-3.5" />{cropping ? t(lang, "Cropping…", "කපා සකසමින්…") : t(lang, "Use photo", "පින්තූරය භාවිතා කරන්න")}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
