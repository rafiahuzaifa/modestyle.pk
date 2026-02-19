"use client";

import { useState } from "react";
import Image from "next/image";

interface Props {
  productImage: string;
  productName: string;
}

export function ImagineOnYou({ productImage, productName }: Props) {
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/ai/imagine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_image_url: productImage,
          product_name: productName,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Failed to generate image");
      }

      const data = await res.json();
      setGeneratedImage(data.image_url);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-r from-gold-50 to-gold-100/50 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-full bg-gold-500 text-white flex items-center justify-center text-xs font-bold">
          AI
        </div>
        <div>
          <p className="text-sm font-medium">Imagine On You</p>
          <p className="text-[11px] text-gray-500">
            AI-powered virtual try-on (3 free/day)
          </p>
        </div>
      </div>

      {generatedImage ? (
        <div className="relative aspect-[3/4] rounded-lg overflow-hidden">
          <Image
            src={generatedImage}
            alt={`Virtual try-on: ${productName}`}
            fill
            className="object-cover"
          />
          <button
            onClick={() => setGeneratedImage(null)}
            className="absolute top-2 right-2 bg-white/80 rounded-full p-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-3 rounded-lg border-2 border-dashed border-gold-300 text-sm text-gold-700 hover:bg-gold-100 transition disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating...
            </span>
          ) : (
            "Try It On Virtually"
          )}
        </button>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-2">{error}</p>
      )}
    </div>
  );
}
