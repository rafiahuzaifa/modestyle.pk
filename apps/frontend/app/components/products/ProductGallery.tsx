"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

const HOVER_ZOOM = 2.5;
const LIGHTBOX_ZOOM = 2.5;

/** Full-resolution Sanity CDN URL for the lightbox (falls back to the original URL). */
const large = (url: string) => (url.includes("cdn.sanity.io") ? `${url}?w=2000&auto=format&q=90` : url);

interface Props {
  images: string[];
  name: string;
  discount?: number;
}

/**
 * Product images with hover-to-zoom (desktop), thumbnails, swipe (mobile)
 * and a full-screen lightbox with click/tap-to-zoom and pan.
 */
export function ProductGallery({ images, name, discount = 0 }: Props) {
  const [index, setIndex] = useState(0);
  const [hover, setHover] = useState<{ x: number; y: number } | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const touchStart = useRef<number | null>(null);

  const count = images.length;
  const go = useCallback((delta: number) => setIndex((i) => (i + delta + count) % count), [count]);

  if (!count) return <div className="aspect-[3/4] rounded-xl bg-gray-50" />;

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setHover({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div className="space-y-4">
      <div
        className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 cursor-zoom-in select-none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        onClick={() => setLightbox(true)}
        onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchStart.current === null || count < 2) return;
          const dx = e.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchStart.current = null;
        }}
      >
        <Image
          key={images[index]}
          src={images[index]}
          alt={`${name}${count > 1 ? ` — image ${index + 1}` : ""}`}
          fill
          priority={index === 0}
          sizes="(max-width: 1024px) 100vw, 50vw"
          quality={90}
          className="object-cover transition-transform duration-200 ease-out"
          style={
            hover
              ? { transform: `scale(${HOVER_ZOOM})`, transformOrigin: `${hover.x}% ${hover.y}%` }
              : { transform: "scale(1)" }
          }
        />
        {discount > 0 && (
          <span className="absolute top-4 left-4 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium">
            -{discount}%
          </span>
        )}
        {count > 1 && (
          <>
            <ArrowButton side="left" onClick={() => go(-1)} />
            <ArrowButton side="right" onClick={() => go(1)} />
          </>
        )}
        <span className="absolute bottom-3 right-3 bg-white/85 text-gray-600 text-[11px] px-2.5 py-1 rounded-full pointer-events-none">
          <span className="hidden md:inline">Hover to zoom · click to enlarge</span>
          <span className="md:hidden">Tap to enlarge</span>
        </span>
      </div>

      {count > 1 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
          {images.map((img, i) => (
            <button
              key={img + i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1}`}
              className={`relative aspect-square rounded-lg overflow-hidden bg-gray-50 border-2 transition ${
                i === index ? "border-gold-400" : "border-transparent hover:border-gold-200"
              }`}
            >
              <Image src={img} alt="" fill className="object-cover" sizes="120px" />
            </button>
          ))}
        </div>
      )}

      {lightbox && <Lightbox images={images} name={name} index={index} setIndex={setIndex} onClose={() => setLightbox(false)} />}
    </div>
  );
}

function ArrowButton({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Previous image" : "Next image"}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`absolute top-1/2 -translate-y-1/2 ${side === "left" ? "left-3" : "right-3"} w-9 h-9 rounded-full bg-white/85 hover:bg-white shadow flex items-center justify-center text-gray-700`}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}

function Lightbox({
  images,
  name,
  index,
  setIndex,
  onClose,
}: {
  images: string[];
  name: string;
  index: number;
  setIndex: (fn: (i: number) => number) => void;
  onClose: () => void;
}) {
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const touchStart = useRef<number | null>(null);
  const count = images.length;

  const go = useCallback(
    (delta: number) => {
      setZoomed(false);
      setIndex((i) => (i + delta + count) % count);
    },
    [count, setIndex]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [go, onClose]);

  const point = (clientX: number, clientY: number, el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * 100, y: ((clientY - r.top) / r.height) * 100 };
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col" role="dialog" aria-modal="true" aria-label={`${name} images`}>
      <div className="flex items-center justify-between px-4 py-3 text-white/80 text-sm">
        <span>
          {index + 1} / {count}
        </span>
        <span className="hidden md:inline text-white/50 text-xs">Click to zoom · move to look around · Esc to close</span>
        <button onClick={onClose} aria-label="Close" className="text-2xl leading-none px-2 hover:text-white">
          ×
        </button>
      </div>

      <div
        className={`relative flex-1 overflow-hidden ${zoomed ? "cursor-zoom-out" : "cursor-zoom-in"}`}
        onClick={(e) => {
          setOrigin(point(e.clientX, e.clientY, e.currentTarget));
          setZoomed((z) => !z);
        }}
        onMouseMove={(e) => zoomed && setOrigin(point(e.clientX, e.clientY, e.currentTarget))}
        onTouchStart={(e) => (touchStart.current = e.touches[0].clientX)}
        onTouchMove={(e) => zoomed && setOrigin(point(e.touches[0].clientX, e.touches[0].clientY, e.currentTarget))}
        onTouchEnd={(e) => {
          if (zoomed || touchStart.current === null || count < 2) return;
          const dx = e.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
          touchStart.current = null;
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={images[index]}
          src={large(images[index])}
          alt={`${name} — image ${index + 1}`}
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain select-none transition-transform duration-200 ease-out"
          style={{ transform: zoomed ? `scale(${LIGHTBOX_ZOOM})` : "scale(1)", transformOrigin: `${origin.x}% ${origin.y}%` }}
        />
        {count > 1 && !zoomed && (
          <>
            <button
              aria-label="Previous image"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white text-2xl"
            >
              ‹
            </button>
            <button
              aria-label="Next image"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white text-2xl"
            >
              ›
            </button>
          </>
        )}
      </div>
    </div>
  );
}
