"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Props {
  productImage: string;
  productName: string;
}

/** Overlay position/size relative to the photo frame (fractions of width/height). */
interface Placement {
  x: number; // centre, 0–1
  y: number; // centre, 0–1
  scale: number; // overlay width as a fraction of frame width
  rotate: number; // degrees
  opacity: number; // 0–1
}

const START: Placement = { x: 0.5, y: 0.42, scale: 0.6, rotate: 0, opacity: 1 };
const FRAME_RATIO = 3 / 4; // width / height

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

/** Sanity CDN: request a sensible size for the overlay. */
const sized = (url: string, w: number) => (url.includes("cdn.sanity.io") ? `${url}?w=${w}&auto=format` : url);

/**
 * Removes a plain background by flood-filling from the image edges with pixels
 * close to the corner colour. Works well for studio/white backgrounds.
 */
function cutOutBackground(img: HTMLImageElement): string {
  const max = 700;
  const k = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * k);
  const h = Math.round(img.height * k);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  const px = data.data;

  const corners = [0, w - 1, (h - 1) * w, h * w - 1].map((i) => [px[i * 4], px[i * 4 + 1], px[i * 4 + 2]]);
  const bg = [0, 1, 2].map((ch) => corners.reduce((s, c) => s + c[ch], 0) / 4);
  const TOL = 38;
  const close = (i: number) =>
    Math.abs(px[i * 4] - bg[0]) < TOL && Math.abs(px[i * 4 + 1] - bg[1]) < TOL && Math.abs(px[i * 4 + 2] - bg[2]) < TOL;

  const seen = new Uint8Array(w * h);
  const stack: number[] = [];
  for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
  for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
  while (stack.length) {
    const i = stack.pop()!;
    if (seen[i] || !close(i)) continue;
    seen[i] = 1;
    px[i * 4 + 3] = 0;
    const x = i % w;
    if (x > 0) stack.push(i - 1);
    if (x < w - 1) stack.push(i + 1);
    if (i >= w) stack.push(i - w);
    if (i < w * (h - 1)) stack.push(i + w);
  }
  ctx.putImageData(data, 0, 0);
  return c.toDataURL("image/png");
}

export function ImagineOnYou({ productImage, productName }: Props) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [camera, setCamera] = useState(false);
  const [overlay, setOverlay] = useState<{ plain: string; cut: string | null } | null>(null);
  const [removeBg, setRemoveBg] = useState(true);
  const [place, setPlace] = useState<Placement>(START);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Prepare the product image (and a background-free copy) once.
  useEffect(() => {
    if (!productImage) return;
    let cancelled = false;
    loadImage(sized(productImage, 900))
      .then((img) => {
        let cut: string | null = null;
        try {
          cut = cutOutBackground(img);
        } catch {
          cut = null; // canvas blocked (CORS) — use the plain image
        }
        if (!cancelled) setOverlay({ plain: sized(productImage, 900), cut });
      })
      .catch(() => !cancelled && setOverlay({ plain: sized(productImage, 900), cut: null }));
    return () => {
      cancelled = true;
    };
  }, [productImage]);

  const onFile = (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhoto(e.target?.result as string);
      setPlace(START);
    };
    reader.readAsDataURL(file);
  };

  const overlaySrc = overlay ? (removeBg && overlay.cut ? overlay.cut : overlay.plain) : null;

  return (
    <div className="rounded-2xl border border-gold-200 overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-secondary to-secondary/90 px-4 py-3.5 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center text-white">📷</div>
        <div>
          <p className="text-white text-sm font-bold tracking-wide">Try It On</p>
          <p className="text-gold-300/80 text-[10px] tracking-wide">Take a selfie and place this {productName.toLowerCase().includes("abaya") ? "abaya" : "piece"} on it</p>
        </div>
        <span className="ml-auto bg-gold-500/20 border border-gold-500/30 text-gold-400 text-[9px] px-2 py-0.5 rounded-full font-medium tracking-wider">
          FREE
        </span>
      </div>

      <div className="bg-white p-4 space-y-3">
        {!photo ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setError("");
                setCamera(true);
              }}
              className="py-5 rounded-xl border-2 border-dashed border-gray-200 hover:border-gold-300 hover:bg-gold-50/50 text-sm font-medium text-gray-700"
            >
              📸 Use camera
            </button>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="py-5 rounded-xl border-2 border-dashed border-gray-200 hover:border-gold-300 hover:bg-gold-50/50 text-sm font-medium text-gray-700"
            >
              🖼️ Upload photo
            </button>
            <input ref={fileRef} type="file" accept="image/*" capture="user" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
          </div>
        ) : (
          <Studio photo={photo} overlaySrc={overlaySrc} place={place} setPlace={setPlace} productName={productName} />
        )}

        {photo && (
          <div className="space-y-3">
            <Slider label="Size" min={0.15} max={1.4} step={0.01} value={place.scale} onChange={(v) => setPlace({ ...place, scale: v })} />
            <Slider label="Rotate" min={-45} max={45} step={1} value={place.rotate} onChange={(v) => setPlace({ ...place, rotate: v })} />
            <Slider label="Blend" min={0.4} max={1} step={0.01} value={place.opacity} onChange={(v) => setPlace({ ...place, opacity: v })} />
            {overlay?.cut && (
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} className="accent-gold-500" />
                Remove product background
              </label>
            )}
            <div className="flex gap-2">
              <SaveButton photo={photo} overlaySrc={overlaySrc} place={place} productName={productName} onError={setError} />
              <button
                type="button"
                onClick={() => {
                  setPhoto(null);
                  setPlace(START);
                }}
                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-xs font-semibold hover:bg-gray-50"
              >
                New photo
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}
        <p className="text-center text-[10px] text-gray-400">
          {photo ? "Drag the product to move it · pinch or use the sliders to resize. " : ""}
          Your photo stays on your device — it is never uploaded.
        </p>
      </div>

      {camera && (
        <CameraModal
          onClose={() => setCamera(false)}
          onCapture={(dataUrl) => {
            setPhoto(dataUrl);
            setPlace(START);
            setCamera(false);
          }}
          onFallback={(msg) => {
            setCamera(false);
            setError(msg);
            fileRef.current?.click();
          }}
        />
      )}
    </div>
  );
}

function Slider(props: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void }) {
  return (
    <label className="flex items-center gap-3 text-xs text-gray-500">
      <span className="w-12">{props.label}</span>
      <input
        type="range"
        min={props.min}
        max={props.max}
        step={props.step}
        value={props.value}
        onChange={(e) => props.onChange(Number(e.target.value))}
        className="flex-1 accent-gold-500"
      />
    </label>
  );
}

/** The photo with a draggable, pinch-resizable product overlay. */
function Studio({
  photo,
  overlaySrc,
  place,
  setPlace,
  productName,
}: {
  photo: string;
  overlaySrc: string | null;
  place: Placement;
  setPlace: (p: Placement) => void;
  productName: string;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const start = useRef<{ place: Placement; dist: number; cx: number; cy: number } | null>(null);

  const snapshot = useCallback(() => {
    const pts = [...pointers.current.values()];
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const dist = pts.length > 1 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    return { cx, cy, dist };
  }, []);

  const onDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    start.current = { place, ...snapshot() };
  };
  const onMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !start.current || !frameRef.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const r = frameRef.current.getBoundingClientRect();
    const now = snapshot();
    const s = start.current;
    const scale = s.dist && now.dist ? Math.min(1.4, Math.max(0.15, (s.place.scale * now.dist) / s.dist)) : s.place.scale;
    setPlace({
      ...s.place,
      x: Math.min(1, Math.max(0, s.place.x + (now.cx - s.cx) / r.width)),
      y: Math.min(1, Math.max(0, s.place.y + (now.cy - s.cy) / r.height)),
      scale,
    });
  };
  const onUp = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    start.current = pointers.current.size ? { place, ...snapshot() } : null;
  };

  return (
    <div ref={frameRef} className="relative w-full overflow-hidden rounded-xl bg-gray-100 touch-none select-none" style={{ aspectRatio: `${FRAME_RATIO}` }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="Your photo" className="absolute inset-0 w-full h-full object-cover pointer-events-none" draggable={false} />
      {overlaySrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={overlaySrc}
          alt={productName}
          draggable={false}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className="absolute cursor-move"
          style={{
            left: `${place.x * 100}%`,
            top: `${place.y * 100}%`,
            width: `${place.scale * 100}%`,
            opacity: place.opacity,
            transform: `translate(-50%, -50%) rotate(${place.rotate}deg)`,
          }}
        />
      )}
    </div>
  );
}

/** Renders photo + overlay into an image and downloads/shares it. */
function SaveButton({
  photo,
  overlaySrc,
  place,
  productName,
  onError,
}: {
  photo: string;
  overlaySrc: string | null;
  place: Placement;
  productName: string;
  onError: (msg: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      const W = 900;
      const H = Math.round(W / FRAME_RATIO);
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d")!;
      const p = await loadImage(photo);
      const k = Math.max(W / p.width, H / p.height); // object-cover
      ctx.drawImage(p, (W - p.width * k) / 2, (H - p.height * k) / 2, p.width * k, p.height * k);
      if (overlaySrc) {
        const o = await loadImage(overlaySrc);
        const ow = place.scale * W;
        const oh = (ow * o.height) / o.width;
        ctx.save();
        ctx.globalAlpha = place.opacity;
        ctx.translate(place.x * W, place.y * H);
        ctx.rotate((place.rotate * Math.PI) / 180);
        ctx.drawImage(o, -ow / 2, -oh / 2, ow, oh);
        ctx.restore();
      }
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      ctx.fillRect(0, H - 44, W, 44);
      ctx.fillStyle = "#d4a853";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${productName} · ModestStyle PK`, W / 2, H - 15);

      const blob = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.92));
      if (!blob) throw new Error("save failed");
      const file = new File([blob], `modeststyle-tryon.jpg`, { type: "image/jpeg" });
      const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: productName }).catch(() => {});
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      }
    } catch {
      onError("Couldn't save the image on this browser. Try taking a screenshot instead.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={save}
      disabled={busy}
      className="flex-1 bg-secondary text-white py-2.5 rounded-xl text-xs font-semibold hover:bg-secondary/90 disabled:opacity-50"
    >
      {busy ? "Saving…" : "Save / share"}
    </button>
  );
}

/** Live front-camera preview with a capture button. Falls back to the file picker. */
function CameraModal({
  onClose,
  onCapture,
  onFallback,
}: {
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  onFallback: (msg: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Keep the latest callback without restarting the camera on every parent render.
  const fallbackRef = useRef(onFallback);
  useEffect(() => {
    fallbackRef.current = onFallback;
  }, [onFallback]);

  useEffect(() => {
    const fallback = (msg: string) => fallbackRef.current(msg);
    if (!navigator.mediaDevices?.getUserMedia) {
      fallback("Camera isn't available in this browser — please choose a photo instead.");
      return;
    }
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => fallback("Camera permission was denied — please choose a photo instead."));
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    const ctx = c.getContext("2d")!;
    // Mirror like the preview so the selfie looks natural.
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0);
    onCapture(c.toDataURL("image/jpeg", 0.92));
  };

  // Portal to <body>: a transformed ancestor would otherwise break position:fixed.
  return createPortal(
    <div className="fixed inset-0 z-[300] bg-black flex flex-col" role="dialog" aria-modal="true" aria-label="Camera">
      <video ref={videoRef} autoPlay playsInline muted className="flex-1 min-h-0 w-full object-cover -scale-x-100" />
      <div className="flex items-center justify-around py-5 bg-black">
        <button onClick={onClose} className="text-white/80 text-sm px-4 py-2">
          Cancel
        </button>
        <button onClick={capture} aria-label="Take photo" className="w-16 h-16 rounded-full bg-white border-4 border-gold-400" />
        <span className="w-[72px]" />
      </div>
    </div>,
    document.body
  );
}
