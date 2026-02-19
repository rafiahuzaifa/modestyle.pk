"use client";

import { useState } from "react";
import { useCartStore } from "@/sanity/lib/cart-store";
import { useWishlistStore } from "@/sanity/lib/wishlist-store";

interface Props {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    images: string[];
    sizes?: string[];
    colors?: { name: string; hex: string }[];
    stock: number;
  };
}

export function AddToCartSection({ product }: Props) {
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || "");
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0]?.name || "");
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const toggleCart = useCartStore((s) => s.toggleCart);
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) =>
    s.items.some((i) => i._id === product._id)
  );

  const handleAddToCart = () => {
    addItem({
      _id: product._id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images?.[0] || "",
      quantity,
      size: selectedSize,
      color: selectedColor,
    });
    toggleCart();
  };

  return (
    <div className="space-y-5 border-t border-b border-gray-100 py-6">
      {/* Size Selector */}
      {product.sizes && product.sizes.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block">Size</label>
          <div className="flex flex-wrap gap-2">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`px-4 py-2 rounded-lg text-sm border transition ${
                  selectedSize === size
                    ? "border-gold-500 bg-gold-50 text-gold-700"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {size.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Color Selector */}
      {product.colors && product.colors.length > 0 && (
        <div>
          <label className="text-sm font-medium mb-2 block">
            Color: <span className="text-gray-500 font-normal">{selectedColor}</span>
          </label>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((color) => (
              <button
                key={color.name}
                onClick={() => setSelectedColor(color.name)}
                className={`w-8 h-8 rounded-full border-2 transition ${
                  selectedColor === color.name
                    ? "border-gold-500 ring-2 ring-gold-200"
                    : "border-gray-200"
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="text-sm font-medium mb-2 block">Quantity</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:border-gold-400 transition"
          >
            -
          </button>
          <span className="w-10 text-center font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
            className="w-10 h-10 rounded-lg border border-gray-200 flex items-center justify-center hover:border-gold-400 transition"
          >
            +
          </button>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0}
          className="flex-1 bg-secondary text-white py-3.5 rounded-lg font-medium hover:bg-secondary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {product.stock === 0 ? "Out of Stock" : "Add to Bag"}
        </button>
        <button
          onClick={() =>
            toggleWishlist({
              _id: product._id,
              name: product.name,
              slug: product.slug,
              price: product.price,
              image: product.images?.[0] || "",
            })
          }
          className={`w-14 rounded-lg border flex items-center justify-center transition ${
            isInWishlist
              ? "border-red-200 bg-red-50 text-red-500"
              : "border-gray-200 hover:border-gold-400"
          }`}
          aria-label="Toggle wishlist"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 24 24"
            fill={isInWishlist ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
