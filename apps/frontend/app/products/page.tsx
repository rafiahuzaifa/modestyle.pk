import Link from "next/link";
import { client } from "@/sanity/lib/client";
import { PRODUCTS_QUERY, CATEGORIES_QUERY } from "@/sanity/lib/queries";
import { ProductCard } from "@/app/components/products/ProductCard";
import { ProductFilters } from "@/app/components/products/ProductFilters";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop Premium Modest Fashion",
  description:
    "Discover our curated collection of luxury hijabs, abayas, jilbabs & accessories.",
};

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  images?: string[];
  category: string;
  categorySlug: string;
  material: string;
  occasion?: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  isBestseller?: boolean;
  isNewArrival?: boolean;
}

interface Category {
  _id: string;
  name: string;
  slug: string;
  subcategories?: { _id: string; name: string; slug: string }[];
}

interface SearchParams {
  category?: string;
  material?: string;
  occasion?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  filter?: string;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [rawProducts, rawCategories] = await Promise.all([
    client.fetch<Product[]>(PRODUCTS_QUERY).catch(() => null),
    client.fetch<Category[]>(CATEGORIES_QUERY).catch(() => null),
  ]);

  const products = rawProducts ?? [];
  const categories = rawCategories ?? [];
  let filtered = [...products];

  if (params.category) {
    filtered = filtered.filter((p) => p.categorySlug === params.category);
  }
  if (params.material) {
    filtered = filtered.filter((p) => p.material === params.material);
  }
  if (params.occasion) {
    filtered = filtered.filter((p) => p.occasion?.includes(params.occasion!));
  }
  if (params.minPrice) {
    filtered = filtered.filter((p) => p.price >= Number(params.minPrice));
  }
  if (params.maxPrice) {
    filtered = filtered.filter((p) => p.price <= Number(params.maxPrice));
  }
  if (params.filter === "new") {
    filtered = filtered.filter((p) => p.isNewArrival);
  }
  if (params.filter === "bestseller") {
    filtered = filtered.filter((p) => p.isBestseller);
  }

  const sort = params.sort || "newest";
  if (sort === "price-asc") filtered.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") filtered.sort((a, b) => b.price - a.price);
  if (sort === "rating") filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));

  const materials = [...new Set(products.map((p) => p.material).filter(Boolean))];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative h-[30vh] md:h-[35vh] bg-gradient-to-r from-secondary to-secondary/90 flex items-center justify-center text-center">
        <div className="space-y-3">
          <h1 className="font-display text-4xl md:text-6xl text-white">
            {params.category
              ? categories.find((c) => c.slug === params.category)?.name || "Collection"
              : "Our Collection"}
          </h1>
          <p className="text-white/60 text-sm">
            Timeless elegance crafted for the modern modest woman
          </p>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <nav className="text-xs text-gray-400 flex gap-2">
          <Link href="/" className="hover:text-gold-500">Home</Link>
          <span>/</span>
          <span className="text-secondary">
            {params.category
              ? categories.find((c) => c.slug === params.category)?.name
              : "All Products"}
          </span>
        </nav>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24">
              <ProductFilters
                categories={categories}
                materials={materials}
                currentCategory={params.category}
                currentMaterial={params.material}
                currentOccasion={params.occasion}
              />
            </div>
          </aside>

          {/* Grid */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium text-secondary">{filtered.length}</span> products
              </p>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-400">Sort by:</label>
                <select
                  className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-gold-300"
                  defaultValue={sort}
                >
                  <option value="newest">Newest</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-400 text-lg mb-2">No products found</p>
                <Link href="/products" className="text-gold-500 text-sm underline">
                  View All Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {filtered.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
