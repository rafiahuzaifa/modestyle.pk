"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface Banner {
  _id: string;
  title: string;
  subtitle?: string;
  isActive: boolean;
  order: number;
  mediaType?: "image" | "video";
  image?: string;
  video?: string;
}

export default function AdminContentPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchBanners = async () => {
    try {
      const res = await fetch("/api/admin/banners");
      const data = await res.json();
      setBanners(data.banners || []);
    } catch {
      setBanners([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // State updates happen after the awaited fetch, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBanners();
  }, []);

  const patchBanner = async (id: string, fields: Record<string, unknown>) => {
    setBusyId(id);
    try {
      await fetch("/api/admin/banners", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...fields }),
      });
      await fetchBanners();
    } finally {
      setBusyId(null);
    }
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Delete this promotion slide? This cannot be undone.")) return;
    setBusyId(id);
    try {
      await fetch("/api/admin/banners", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      await fetchBanners();
    } finally {
      setBusyId(null);
    }
  };

  const move = async (banner: Banner, direction: -1 | 1) => {
    const sorted = [...banners].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((b) => b._id === banner._id);
    const swapWith = sorted[idx + direction];
    if (!swapWith) return;
    await Promise.all([
      patchBanner(banner._id, { order: swapWith.order }),
      patchBanner(swapWith._id, { order: banner.order }),
    ]);
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading...</div>;
  }

  const sorted = [...banners].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display">Homepage Promotion</h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage the image/video slides shown in the hero carousel
          </p>
        </div>
        <a
          href="/production/intent/create/template=banner;type=banner"
          target="_blank"
          className="bg-gold-500 hover:bg-gold-600 text-white text-sm px-4 py-2.5 rounded-lg transition"
        >
          + Add New Slide
        </a>
      </div>

      {sorted.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400">
          No promotion slides yet. Click &ldquo;Add New Slide&rdquo; to create one in Sanity Studio
          (upload an image or video, then come back here to activate/order it).
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {sorted.map((b, i) => (
            <div key={b._id} className="flex items-center gap-4 p-4">
              <div className="w-20 h-14 rounded-lg bg-gray-100 overflow-hidden relative flex-shrink-0">
                {b.mediaType === "video" && b.video ? (
                  <video src={b.video} className="w-full h-full object-cover" muted />
                ) : b.image ? (
                  <Image src={b.image} alt={b.title} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                    No media
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{b.title}</p>
                <p className="text-xs text-gray-400 truncate">{b.subtitle}</p>
                <span className="inline-block mt-1 text-[10px] uppercase tracking-wide text-gray-400">
                  {b.mediaType === "video" ? "🎬 Video" : "🖼 Image"}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  disabled={i === 0 || busyId === b._id}
                  onClick={() => move(b, -1)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-50 text-gray-400 disabled:opacity-30 flex items-center justify-center"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  disabled={i === sorted.length - 1 || busyId === b._id}
                  onClick={() => move(b, 1)}
                  className="w-8 h-8 rounded-lg hover:bg-gray-50 text-gray-400 disabled:opacity-30 flex items-center justify-center"
                  aria-label="Move down"
                >
                  ↓
                </button>
              </div>

              <button
                onClick={() => patchBanner(b._id, { isActive: !b.isActive })}
                disabled={busyId === b._id}
                className={`text-xs px-3 py-1.5 rounded-full font-medium transition ${
                  b.isActive
                    ? "bg-green-50 text-green-600 hover:bg-green-100"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {b.isActive ? "Active" : "Inactive"}
              </button>

              <button
                onClick={() => deleteBanner(b._id)}
                disabled={busyId === b._id}
                className="text-xs text-red-400 hover:text-red-600 px-2"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Upload or edit slide images/videos, titles, and button links in{" "}
        <a href="/production" target="_blank" className="text-gold-600 underline">
          Sanity Studio
        </a>
        . Use this page to activate, reorder, or remove slides.
      </p>
    </div>
  );
}
