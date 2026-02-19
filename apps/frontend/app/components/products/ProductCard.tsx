"use client";

import Link from "next/link";
import Image from "next/image";
import { useWishlistStore } from "@/sanity/lib/wishlist-store";
import { useCartStore } from "@/sanity/lib/cart-store";

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    image: string;
    images?: string[];
    category: string;
    rating?: number;
    reviewCount?: number;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const toggleWishlist = useWishlistStore((s) => s.toggleItem);
  const isInWishlist = useWishlistStore((s) =>
    s.items.some((i) => i._id === product._id)
  );
  const addToCart = useCartStore((s) => s.addItem);

  const discount = product.compareAtPrice
    ? Math.round(
        ((product.compareAtPrice - product.price) / product.compareAtPrice) *
          100
      )
    : 0;

  return (
    <div className="group relative">
      {/* Image */}
      <Link href={`/products/${product.slug}`}>
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gray-100">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gold-50 to-gold-100 flex items-center justify-center">
              <span className="text-gold-300 text-4xl font-display">M</span>
            </div>
          )}

          {/* Hover second image */}
          {product.images && product.images[1] && (
            <Image
              src={product.images[1]}
              alt={product.name}
              fill
              className="object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 absolute inset-0"
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {discount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                -{discount}%
              </span>
            )}
          </div>

          {/* Quick Add */}
          <button
            onClick={(e) => {
              e.preventDefault();
              addToCart({
                _id: product._id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                image: product.image,
                quantity: 1,
              });
            }}
            className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm text-secondary text-xs font-medium py-2.5 rounded-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 hover:bg-secondary hover:text-white"
          >
            Quick Add
          </button>
        </div>
      </Link>

      {/* Wishlist */}
      <button
        onClick={() =>
          toggleWishlist({
            _id: product._id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            image: product.image,
          })
        }
        className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition z-10"
        aria-label="Toggle wishlist"
      >
        <svg
          className={`w-4 h-4 ${
            isInWishlist ? "text-red-500 fill-red-500" : "text-gray-400"
          }`}
          viewBox="0 0 24 24"
          stroke="currentColor"
          fill={isInWishlist ? "currentColor" : "none"}
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>

      {/* Info */}
      <div className="mt-3 px-1">
        <p className="text-[10px] text-gold-500 uppercase tracking-wider">
          {product.category}
        </p>
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-medium mt-0.5 truncate hover:text-gold-600 transition">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-medium">
            PKR {product.price.toLocaleString()}
          </span>
          {product.compareAtPrice && (
            <span className="text-xs text-gray-400 line-through">
              PKR {product.compareAtPrice.toLocaleString()}
            </span>
          )}
        </div>
        {product.rating && product.rating > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-3 h-3 ${
                    i < Math.round(product.rating!) ? "text-gold-400" : "text-gray-200"
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-[10px] text-gray-400">
              ({product.reviewCount})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
