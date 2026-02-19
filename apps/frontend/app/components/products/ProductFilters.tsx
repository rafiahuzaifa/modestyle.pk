"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

interface Category {
  _id: string;
  name: string;
  slug: string;
  subcategories?: { _id: string; name: string; slug: string }[];
}

interface ProductFiltersProps {
  categories: Category[];
  materials: string[];
  currentCategory?: string;
  currentMaterial?: string;
  currentOccasion?: string;
}

const OCCASIONS = ["Casual", "Office", "Formal", "Party", "Bridal", "Everyday"];
const PRICE_RANGES = [
  { label: "Under PKR 1,500", min: 0, max: 1500 },
  { label: "PKR 1,500 - 3,000", min: 1500, max: 3000 },
  { label: "PKR 3,000 - 5,000", min: 3000, max: 5000 },
  { label: "PKR 5,000 - 8,000", min: 5000, max: 8000 },
  { label: "Over PKR 8,000", min: 8000, max: 99999 },
];

export function ProductFilters({
  categories,
  materials,
  currentCategory,
  currentMaterial,
  currentOccasion,
}: ProductFiltersProps) {
  const searchParams = useSearchParams();

  const buildUrl = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    return `/products?${params.toString()}`;
  };

  return (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-medium uppercase tracking-wider mb-4">
          Categories
        </h3>
        <ul className="space-y-2">
          <li>
            <Link
              href="/products"
              className={`text-sm block py-1 transition ${
                !currentCategory
                  ? "text-gold-600 font-medium"
                  : "text-gray-500 hover:text-secondary"
              }`}
            >
              All Products
            </Link>
          </li>
          {categories.map((cat) => (
            <li key={cat._id}>
              <Link
                href={buildUrl("category", cat.slug)}
                className={`text-sm block py-1 transition ${
                  currentCategory === cat.slug
                    ? "text-gold-600 font-medium"
                    : "text-gray-500 hover:text-secondary"
                }`}
              >
                {cat.name}
              </Link>
              {/* Subcategories */}
              {cat.subcategories && currentCategory === cat.slug && (
                <ul className="ml-4 mt-1 space-y-1">
                  {cat.subcategories.map((sub) => (
                    <li key={sub._id}>
                      <Link
                        href={buildUrl("category", sub.slug)}
                        className="text-xs text-gray-400 hover:text-gold-500 transition block py-0.5"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-medium uppercase tracking-wider mb-4">
          Price
        </h3>
        <ul className="space-y-2">
          {PRICE_RANGES.map((range) => (
            <li key={range.label}>
              <Link
                href={`/products?${new URLSearchParams({
                  ...Object.fromEntries(searchParams.entries()),
                  minPrice: String(range.min),
                  maxPrice: String(range.max),
                }).toString()}`}
                className="text-sm text-gray-500 hover:text-gold-600 transition block py-1"
              >
                {range.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Material */}
      <div>
        <h3 className="text-sm font-medium uppercase tracking-wider mb-4">
          Material
        </h3>
        <ul className="space-y-2">
          {materials.map((mat) => (
            <li key={mat}>
              <Link
                href={buildUrl("material", mat)}
                className={`text-sm block py-1 transition ${
                  currentMaterial === mat
                    ? "text-gold-600 font-medium"
                    : "text-gray-500 hover:text-secondary"
                }`}
              >
                {mat}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Occasion */}
      <div>
        <h3 className="text-sm font-medium uppercase tracking-wider mb-4">
          Occasion
        </h3>
        <ul className="space-y-2">
          {OCCASIONS.map((occ) => (
            <li key={occ}>
              <Link
                href={buildUrl("occasion", occ.toLowerCase())}
                className={`text-sm block py-1 transition ${
                  currentOccasion === occ.toLowerCase()
                    ? "text-gold-600 font-medium"
                    : "text-gray-500 hover:text-secondary"
                }`}
              >
                {occ}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
