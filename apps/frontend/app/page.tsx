import Link from "next/link";
import Image from "next/image";
import { client } from "@/sanity/lib/client";
import {
  HERO_BANNERS,
  CATEGORIES_QUERY,
  BESTSELLERS,
  NEW_ARRIVALS,
} from "@/sanity/lib/queries";
import { ProductCard } from "@/app/components/products/ProductCard";

// ─── Types ───────────────────────────────────────────────────────────
interface Banner {
  _id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  buttonText: string;
}
interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
}
interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  images?: string[];
  category: string;
  rating: number;
  reviewCount: number;
  isBestseller?: boolean;
  isNewArrival?: boolean;
}

// ─── Data fetching ───────────────────────────────────────────────────
async function getHomeData() {
  const [banners, categories, bestsellers, newArrivals] = await Promise.all([
    client.fetch<Banner[]>(HERO_BANNERS).catch(() => null),
    client.fetch<Category[]>(CATEGORIES_QUERY).catch(() => null),
    client.fetch<Product[]>(BESTSELLERS).catch(() => null),
    client.fetch<Product[]>(NEW_ARRIVALS).catch(() => null),
  ]);
  return {
    banners: banners ?? [],
    categories: categories ?? [],
    bestsellers: bestsellers ?? [],
    newArrivals: newArrivals ?? [],
  };
}

// ─── Page ────────────────────────────────────────────────────────────
export default async function HomePage() {
  const { banners, categories, bestsellers, newArrivals } =
    await getHomeData();

  const heroBanner = banners?.[0];

  return (
    <div>
      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <section className="relative h-[70vh] md:h-[85vh] overflow-hidden bg-secondary">
        {heroBanner?.image ? (
          <Image
            src={heroBanner.image}
            alt={heroBanner.title || "ModestStyle"}
            fill
            className="object-cover opacity-60"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/95 to-gold-900/80" />
        )}
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="max-w-2xl space-y-6 animate-fade-in">
            <p className="text-gold-400 text-sm tracking-[0.3em] uppercase">
              Elegance in Every Drape
            </p>
            <h1 className="font-display text-4xl md:text-6xl lg:text-7xl text-white leading-tight">
              {heroBanner?.title || "Modest Fashion, Elevated"}
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-lg mx-auto">
              {heroBanner?.subtitle ||
                "Discover our curated collection of premium hijabs, abayas & modest wear crafted for the modern woman."}
            </p>
            <div className="flex gap-4 justify-center pt-2">
              <Link
                href={heroBanner?.link || "/products"}
                className="bg-gold-500 hover:bg-gold-600 text-white px-8 py-3.5 rounded-lg text-sm font-medium tracking-wide transition"
              >
                {heroBanner?.buttonText || "Shop Now"}
              </Link>
              <Link
                href="/products?filter=new"
                className="border border-white/30 text-white hover:bg-white/10 px-8 py-3.5 rounded-lg text-sm font-medium tracking-wide transition"
              >
                New Arrivals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Free Shipping Banner ────────────────────────────────── */}
      <section className="bg-gold-50 border-y border-gold-100">
        <div className="container mx-auto px-4 py-4 flex flex-wrap justify-center gap-8 text-xs tracking-wide text-secondary/70">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" /></svg>
            FREE SHIPPING OVER PKR 5,000
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            EASY RETURNS
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            100% AUTHENTIC
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gold-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
            SECURE PAYMENT
          </div>
        </div>
      </section>

      {/* ── Category Grid (7 cards) ─────────────────────────────── */}
      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="text-center mb-12">
          <p className="text-gold-500 text-xs tracking-[0.25em] uppercase mb-2">
            Curated Collections
          </p>
          <h2 className="font-display text-3xl md:text-4xl">
            Shop by Category
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {(categories.length > 0
            ? categories
            : FALLBACK_CATEGORIES
          ).map((cat, i) => (
            <Link
              key={cat._id || i}
              href={`/products?category=${cat.slug}`}
              className={`group relative overflow-hidden rounded-xl aspect-[3/4] ${
                i === 0 ? "md:col-span-2 md:row-span-2" : ""
              }`}
            >
              {cat.image ? (
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-gold-100 to-gold-200" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="font-display text-white text-lg md:text-xl">
                  {cat.name}
                </h3>
                <p className="text-white/70 text-xs mt-1 group-hover:text-gold-300 transition">
                  Shop Now &rarr;
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Bestsellers ─────────────────────────────────────────── */}
      {bestsellers.length > 0 && (
        <section className="bg-accent py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-gold-500 text-xs tracking-[0.25em] uppercase mb-2">
                  Most Loved
                </p>
                <h2 className="font-display text-3xl md:text-4xl">
                  Bestsellers
                </h2>
              </div>
              <Link
                href="/products?filter=bestseller"
                className="text-sm text-gold-600 hover:text-gold-700 transition hidden md:block"
              >
                View All &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {bestsellers.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Mid Banner ──────────────────────────────────────────── */}
      <section className="relative h-[40vh] md:h-[50vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary to-secondary/90" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div className="max-w-xl space-y-5">
            <p className="text-gold-400 text-xs tracking-[0.3em] uppercase">
              New Season
            </p>
            <h2 className="font-display text-3xl md:text-5xl text-white">
              Abaya Collection 2026
            </h2>
            <p className="text-white/60 text-sm">
              Timeless silhouettes meet contemporary craftsmanship. Discover
              abayas that move with you.
            </p>
            <Link
              href="/products?category=abayas"
              className="inline-block bg-gold-500 text-white px-8 py-3 rounded-lg text-sm hover:bg-gold-600 transition"
            >
              Explore Abayas
            </Link>
          </div>
        </div>
      </section>

      {/* ── New Arrivals ────────────────────────────────────────── */}
      {newArrivals.length > 0 && (
        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-gold-500 text-xs tracking-[0.25em] uppercase mb-2">
                Just Landed
              </p>
              <h2 className="font-display text-3xl md:text-4xl">
                New Arrivals
              </h2>
            </div>
            <Link
              href="/products?filter=new"
              className="text-sm text-gold-600 hover:text-gold-700 transition hidden md:block"
            >
              View All &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ── Testimonials ────────────────────────────────────────── */}
      <section className="bg-gold-50 py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gold-500 text-xs tracking-[0.25em] uppercase mb-2">
            Loved by thousands
          </p>
          <h2 className="font-display text-3xl md:text-4xl mb-8">
            What Our Customers Say
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-6 shadow-sm border border-gold-100"
              >
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-4 h-4 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                  &ldquo;{t.text}&rdquo;
                </p>
                <p className="text-xs font-medium text-gold-600">{t.name}</p>
                <p className="text-xs text-gray-400">{t.city}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// ─── Fallback data when Sanity has no content yet ────────────────────
const FALLBACK_CATEGORIES = [
  { _id: "1", name: "Hijabs", slug: "hijabs", image: "", description: "" },
  { _id: "2", name: "Abayas", slug: "abayas", image: "", description: "" },
  { _id: "3", name: "Accessories", slug: "accessories", image: "", description: "" },
  { _id: "4", name: "Jilbabs", slug: "jilbabs", image: "", description: "" },
  { _id: "5", name: "Prayer Wear", slug: "prayer-wear", image: "", description: "" },
  { _id: "6", name: "Innerwear", slug: "innerwear", image: "", description: "" },
  { _id: "7", name: "Kids Modest", slug: "kids-modest", image: "", description: "" },
];

const TESTIMONIALS = [
  {
    text: "The georgette hijab is so soft and drapes beautifully. Best quality I've found in Pakistan!",
    name: "Ayesha K.",
    city: "Lahore",
  },
  {
    text: "My abaya arrived perfectly pressed and the embroidery is stunning. Will order again!",
    name: "Fatima R.",
    city: "Karachi",
  },
  {
    text: "Fast shipping and the colours are exactly like the photos. Love ModestStyle!",
    name: "Maryam S.",
    city: "Islamabad",
  },
];
