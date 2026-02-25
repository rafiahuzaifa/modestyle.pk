"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

export interface RecentProduct {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  category: string;
}

const STORAGE_KEY = "modestyle_recently_viewed";
const MAX_ITEMS = 8;

export function addToRecentlyViewed(product: RecentProduct) {
  if (typeof window === "undefined") return;
  try {
    const existing: RecentProduct[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );
    const filtered = existing.filter((p) => p._id !== product._id);
    const updated = [product, ...filtered].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // ignore storage errors
  }
}

export function RecentlyViewed({ currentId }: { currentId?: string }) {
  const [products, setProducts] = useState<RecentProduct[]>([]);

  useEffect(() => {
    try {
      const items: RecentProduct[] = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );
      setProducts(items.filter((p) => p._id !== currentId));
    } catch {
      setProducts([]);
    }
  }, [currentId]);

  if (products.length === 0) return null;

  return (
    <section className="mt-16 pt-12 border-t border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] text-gold-500 uppercase tracking-[0.2em] font-medium mb-1">
            Your History
          </p>
          <h2 className="font-display text-2xl text-secondary">Recently Viewed</h2>
        </div>
        <button
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY);
            setProducts([]);
          }}
          className="text-xs text-gray-400 hover:text-gray-600 transition"
        >
          Clear
        </button>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin scrollbar-thumb-gold-200 scrollbar-track-transparent">
        {products.map((product) => {
          const discount = product.compareAtPrice
            ? Math.round(
                ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
              )
            : 0;
          return (
            <Link
              key={product._id}
              href={`/products/${product.slug}`}
              className="flex-shrink-0 w-40 group"
            >
              {/* Image */}
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 mb-2.5">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="160px"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gold-50 to-gold-100 flex items-center justify-center">
                    <span className="text-gold-300 text-2xl font-display">M</span>
                  </div>
                )}
                {discount > 0 && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-medium">
                    -{discount}%
                  </span>
                )}
                {/* View overlay */}
                <div className="absolute inset-0 bg-secondary/0 group-hover:bg-secondary/10 transition-colors duration-300 rounded-xl" />
                <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="bg-white/95 text-secondary text-[10px] font-medium px-2 py-1 rounded-lg block text-center">
                    View Product
                  </span>
                </div>
              </div>

              {/* Info */}
              <p className="text-[10px] text-gold-500 uppercase tracking-wider mb-0.5">
                {product.category}
              </p>
              <p className="text-xs font-medium text-secondary truncate group-hover:text-gold-600 transition leading-snug">
                {product.name}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-xs font-semibold">
                  PKR {product.price.toLocaleString()}
                </span>
                {product.compareAtPrice && (
                  <span className="text-[10px] text-gray-400 line-through">
                    {product.compareAtPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
