import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { client } from "@/sanity/lib/client";
import {
  PRODUCT_BY_SLUG,
  RELATED_PRODUCTS,
  PRODUCT_REVIEWS,
} from "@/sanity/lib/queries";
import { ProductCard } from "@/app/components/products/ProductCard";
import { AddToCartSection } from "@/app/components/products/AddToCartSection";
import { ImagineOnYou } from "@/app/components/products/ImagineOnYou";
import type { Metadata } from "next";

// ─── Types ───────────────────────────────────────────────────────────
interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: { _id: string; name: string; slug: string };
  subcategory?: { name: string; slug: string };
  material: string;
  sizes: string[];
  colors: { name: string; hex: string }[];
  stock: number;
  sku: string;
  rating: number;
  reviewCount: number;
  tags: string[];
  occasion: string[];
}

interface Review {
  _id: string;
  author: string;
  rating: number;
  comment: string;
  _createdAt: string;
}

// ─── Metadata ────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await client.fetch<Product>(PRODUCT_BY_SLUG, { slug });
  if (!product) return { title: "Product Not Found" };

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

// ─── Page ────────────────────────────────────────────────────────────
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await client.fetch<Product>(PRODUCT_BY_SLUG, { slug });

  if (!product) notFound();

  const [relatedProducts, reviews] = await Promise.all([
    product.category?._id
      ? client.fetch(RELATED_PRODUCTS, {
          categoryId: product.category._id,
          productId: product._id,
        })
      : [],
    client.fetch<Review[]>(PRODUCT_REVIEWS, { productId: product._id }),
  ]);

  const discount = product.compareAtPrice
    ? Math.round(
        ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
      )
    : 0;

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "PKR",
      availability: product.stock > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    aggregateRating: product.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: product.rating,
          reviewCount: product.reviewCount,
        }
      : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-white">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 py-4">
          <nav className="text-xs text-gray-400 flex gap-2">
            <Link href="/" className="hover:text-gold-500">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-gold-500">Shop</Link>
            <span>/</span>
            {product.category && (
              <>
                <Link
                  href={`/products?category=${product.category.slug}`}
                  className="hover:text-gold-500"
                >
                  {product.category.name}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="text-secondary truncate">{product.name}</span>
          </nav>
        </div>

        {/* Product Section */}
        <div className="container mx-auto px-4 pb-16">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16">
            {/* Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-50">
                {product.images?.[0] && (
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                )}
                {discount > 0 && (
                  <span className="absolute top-4 left-4 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                    -{discount}%
                  </span>
                )}
              </div>
              {/* Thumbnails */}
              <div className="grid grid-cols-4 gap-3">
                {product.images?.slice(0, 4).map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-lg overflow-hidden bg-gray-50 cursor-pointer border-2 border-transparent hover:border-gold-400 transition"
                  >
                    <Image
                      src={img}
                      alt={`${product.name} ${i + 1}`}
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="lg:py-4">
              <div className="space-y-6">
                {/* Category & Name */}
                <div>
                  <p className="text-xs text-gold-500 uppercase tracking-widest mb-2">
                    {product.category?.name}
                    {product.subcategory && ` / ${product.subcategory.name}`}
                  </p>
                  <h1 className="font-display text-3xl md:text-4xl leading-tight">
                    {product.name}
                  </h1>
                </div>

                {/* Rating */}
                {product.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.round(product.rating)
                              ? "text-gold-400"
                              : "text-gray-200"
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-sm text-gray-500">
                      ({product.reviewCount} reviews)
                    </span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-medium">
                    PKR {product.price.toLocaleString()}
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-lg text-gray-400 line-through">
                      PKR {product.compareAtPrice.toLocaleString()}
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="text-sm text-red-500 font-medium">
                      Save {discount}%
                    </span>
                  )}
                </div>

                {/* Description */}
                {product.description && (
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {product.description}
                  </p>
                )}

                {/* Details */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {product.material && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-400 text-xs">Material</p>
                      <p className="font-medium">{product.material}</p>
                    </div>
                  )}
                  {product.sku && (
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-gray-400 text-xs">SKU</p>
                      <p className="font-medium">{product.sku}</p>
                    </div>
                  )}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-gray-400 text-xs">Availability</p>
                    <p className={`font-medium ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>
                      {product.stock > 0 ? `In Stock (${product.stock})` : "Out of Stock"}
                    </p>
                  </div>
                </div>

                {/* Add to Cart */}
                <AddToCartSection product={product} />

                {/* Imagine On You */}
                <ImagineOnYou productImage={product.images?.[0]} productName={product.name} />

                {/* Shipping info */}
                <div className="border-t border-gray-100 pt-6 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <svg className="w-5 h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                    </svg>
                    Free shipping on orders over PKR 5,000
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <svg className="w-5 h-5 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Easy 7-day returns
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          {reviews.length > 0 && (
            <section className="mt-16 pt-12 border-t border-gray-100">
              <h2 className="font-display text-2xl mb-8">
                Customer Reviews ({reviews.length})
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                {reviews.map((review: Review) => (
                  <div key={review._id} className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < review.rating ? "text-gold-400" : "text-gray-200"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(review._createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{review.comment}</p>
                    <p className="text-xs font-medium text-gold-600">{review.author}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-16 pt-12 border-t border-gray-100">
              <h2 className="font-display text-2xl mb-8">You May Also Like</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((p: any) => (
                  <ProductCard key={p._id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
